import { BrowserContext, Page, expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { E2E_ORIGIN } from './helpers/config';
import { IIIF_FIXTURE_ORIGIN } from './helpers/fixtures';
import { StoredAnnotation, readStoredAnnotations } from './helpers/indexeddb';
import { createAnnotatedCollection, openExportDialog } from './helpers/journeys';
import { installE2ENetwork } from './helpers/network';
import {
  BTN_EXPORT,
  INCLUDE_ANNOTATIONS,
  INCLUDE_MANIFEST,
  LOG_EXPORT_COMPLETED,
} from './helpers/selectors';

// Étape 5 du plan Q9 — scénario S4 : export de la collection annotée.
//
// La chaîne complète est rejouée à chaque exécution (`createAnnotatedCollection`,
// S1→S3) : IndexedDB est vierge par contexte et un export sans contenu utile n'a
// aucune valeur. Comme en étapes 3 et 4, les tests de la série partagent UN SEUL
// contexte (créé dans `beforeAll`, interception réseau installée dessus) pour que
// l'état construit par la préparation survive jusqu'au test d'export. L'export est
// 100 % local (JSZip + FileSaver dans le navigateur) ; l'interception reste active,
// toute sortie externe serait avortée bruyamment.
//
// Ce que l'on sait du code exporté (`src/hooks/data/collections/useCollectionIO.tsx`) :
// - une entrée ZIP `<nom de la collection>.json` par collection, contenu
//   `{ collection, tags?, sources?, annotations?, ... }` sérialisé en JSON ;
// - le dialogue ne se ferme PAS après export (`closeOnAction: false`, pour voir
//   les logs) → la ligne de succès du LoggerPanel est le signal web-first de fin
//   d'export côté UI ; le signal autoritaire est le flux du téléchargement lui-même ;
// - `suggestedFilename` : `exported_collections.zip` (constante de code).
// Entrées RÉELLES observées au spike (2026-10-13) : unique entrée
// `Collection E2E Q9.json` — options par défaut (annotations incluses, manifest IIIF
// exclu), collection sans tags ni modèle, sans worker → pas d'autres entrées.

/** Collection et annotation reconstruites par le parcours S1→S3. */
const COLLECTION_NAME = 'Collection E2E Q9';
const ANNOTATION_VALUE = 'Région de contrôle E2E';

/** Identifiant du canvas de fixture (`e2e/fixtures/manifest.json` → `@id`). */
const FIXTURE_CANVAS_ID = `${IIIF_FIXTURE_ORIGIN}/canvas/p1`;

test.describe.serial('export de collection', () => {
  test.describe.configure({ timeout: 60_000 });

  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      baseURL: E2E_ORIGIN,
      locale: 'fr',
      viewport: { width: 1280, height: 720 },
    });
    page = await context.newPage();
    await installE2ENetwork(page);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('préparation — S1→S3 rejoués : la collection porte son annotation de contrôle', async () => {
    await createAnnotatedCollection(page, COLLECTION_NAME, ANNOTATION_VALUE);

    // La matière première de l'export est là, relue depuis IndexedDB (D-004).
    await expect
      .poll(async () => (await readStoredAnnotations(page))[0]?.value, {
        message: 'annotation de contrôle absente d’IndexedDB',
        timeout: 10_000,
      })
      .toBe(ANNOTATION_VALUE);
  });

  test('S4 — l’export télécharge un ZIP local contenant les annotations', async () => {
    // L'annotation doit être dans l'export : options par défaut vérifiées aux rôles
    // accessibles — annotations incluses (défaut vrai), manifest IIIF exclu (faux).
    await openExportDialog(page);
    const dialog = page.getByRole('alertdialog');
    await expect(dialog.getByRole('checkbox', { name: INCLUDE_ANNOTATIONS })).toBeChecked();
    await expect(dialog.getByRole('checkbox', { name: INCLUDE_MANIFEST })).not.toBeChecked();

    // Promesse du téléchargement AVANT la validation : le clic déclenche
    // `FileSaver.saveAs` dès le ZIP généré, aucune course de fenêtre.
    const downloadPromise = page.waitForEvent('download');
    await dialog.getByRole('button', { name: BTN_EXPORT, exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('exported_collections.zip');

    // Signal web-first de fin d'export côté UI : le dialogue reste ouvert
    // (`closeOnAction: false`) et son LoggerPanel affiche la ligne de succès.
    await expect(page.getByText(LOG_EXPORT_COMPLETED)).toBeVisible();

    // Fin autoritaire du flux puis lecture du ZIP en mémoire, sans fichier garde.
    // Note d'API : le nœud Playwright n'a pas de `download.finished()` (méthode
    // .NET/Python) ; `path()` est l'équivalent Node — il ne se résout qu'une fois
    // le téléchargement terminé. Le build jszip installé rejette les flux en
    // lecture (`JSZip can't accept a stream`) : on tamponne le flux
    // `createReadStream()` en mémoire — lecture en mémoire, toujours aucun fichier garde.
    await download.path();
    const zipBytes = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      download
        .createReadStream()
        .then((stream) => {
          stream.on('data', (chunk: Buffer) => chunks.push(chunk));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
          stream.on('error', reject);
        })
        .catch(reject);
    });

    // Non-vacuité : des octets, puis au moins une entrée.
    expect(zipBytes.byteLength).toBeGreaterThan(0);
    const zip = await JSZip.loadAsync(zipBytes);
    const entries = zip.file(/.*/);
    const entryNames = entries.map((entry) => entry.name);
    expect(entryNames.length).toBeGreaterThanOrEqual(1);

    // Entrée JSON de la collection exportée (structure posée par useCollectionIO :
    // une entrée `<nom de la collection>.json` par collection ; seule attendue ici).
    expect(entryNames).toEqual([`${COLLECTION_NAME}.json`]);
    const raw = await zip.file(`${COLLECTION_NAME}.json`)!.async('arraybuffer');
    expect(raw.byteLength).toBeGreaterThan(0);
    const exported = JSON.parse(new TextDecoder().decode(raw)) as {
      collection: { id: string; name: string };
      sources?: unknown[];
      annotations?: {
        canvasId: string;
        collectionId: string;
        type: string;
        bodies?: { purpose?: string; value?: string }[];
      }[];
    };

    // La collection exportée est bien la nôtre, et la source de fixture est jointe.
    expect(exported.collection.name).toBe(COLLECTION_NAME);
    expect(exported.sources?.length).toBe(1);

    // Contenu clé : l'annotation de contrôle S3, rattachée à notre collection et
    // au canvas de fixture, avec sa valeur (body « tagging », cf. createBodies).
    expect(exported.annotations?.length).toBe(1);
    const annotation = exported.annotations?.[0];
    expect(annotation?.canvasId).toBe(FIXTURE_CANVAS_ID);
    expect(annotation?.type).toBe('TEXT_REGION');
    expect(annotation?.bodies?.find((body) => body.purpose === 'tagging')?.value).toBe(
      ANNOTATION_VALUE,
    );
    const stored: StoredAnnotation[] = await readStoredAnnotations(page);
    expect(annotation?.collectionId).toBe(stored[0]?.collectionId);
    expect(exported.collection.id).toBe(stored[0]?.collectionId);

    // Le manifest IIIF n'était pas coché : aucune entrée `_manifest.json`.
    expect(entryNames.filter((name) => name.endsWith('_manifest.json'))).toHaveLength(0);

    // Le dialogue ne se ferme pas de lui-même (`closeOnAction: false`) : on le
    // referme proprement, comme le ferait l'utilisateur.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
