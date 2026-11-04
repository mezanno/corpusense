import { BrowserContext, Page, expect, test } from '@playwright/test';
import { E2E_ORIGIN } from './helpers/config';
import {
  MANIFEST_FIXTURE_TITLE,
  createCollectionFromSource,
  displayFixtureCanvas,
  importFixtureManifest,
  openCollectionInspector,
} from './helpers/journeys';
import { installE2ENetwork } from './helpers/network';
import {
  MANIFEST_GRID,
  NAV_SOURCES,
  TITLE_METADATA_COLLECTION,
  numberOfCollections,
  numberOfItems,
} from './helpers/selectors';

// Étape 3 du plan Q9 — parcours critique S1 + S2 en série (D-010 : rôles accessibles
// et libellés FR, jamais de sélecteur d'implémentation).
//
// S1 : import d'un manifest IIIF (fixture servie en interception) depuis la page
// « Bibliothèques en ligne » (/iiifSources, seule porte d'entrée de OpenManifestForm)
// → la source rejoint la bibliothèque (carte + explorateur de manifests).
// S2 : création d'une collection À PARTIR DE CETTE SOURCE via la sélection du canvas
// dans la galerie de l'explorateur (menu contextuel « Créer une collection à partir de
// la sélection ») → collection listée dans /collections, ouvrable dans son inspecteur,
// toujours présente après rechargement (preuve de persistance Dexie/IndexedDB).
//
// Les gestes du parcours sont extraits dans `helpers/journeys.ts` (partagés avec S3) ;
// la spec garde les assertions propres au scénario. Enseignements du spike (2026-10-13),
// rappelés là où ils restent visibles :
// - le nom de la source est PROPOSÉ (placeholder du champ de renommage), pas pré-rempli :
//   on le saisit explicitement pour que le nom stocké soit déterministe ;
// - le champ nom du dialogue NewCollectionForm (react-hook-form 7.79, mode onChange)
//   n'active le bouton « Créer » qu'au clavier réel : `pressSequentially` est le seul
//   geste fiable (voir journeys.createCollectionFromSource) ;
// - les deux tests partagent UN SEUL contexte navigateur (créé dans `beforeAll`) :
//   `test.describe.serial` seul ne suffit pas, Playwright crée un contexte (donc une
//   IndexedDB) neuf par test. C'est ce qui fait de S2 la suite réelle de S1.

/** Nom de la collection créée par S2 (donnée de test, sans correspondance i18n). */
const COLLECTION_NAME = 'Collection E2E Q9';

test.describe.serial('parcours import manifest → collection', () => {
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

  test('S1 — le manifest importé rejoint la bibliothèque des sources', async () => {
    // Le helper rejoue l'import et attend lui-même les deux étapes du dialogue
    // (« 1. Charger un manifest IIIF » puis « 2. Ajouter le manifest… ») ainsi que
    // sa fermeture après persistance ; ici, la vérification clé du scénario :
    await importFixtureManifest(page);

    // Bibliothèque en ligne : la source apparaît en carte, nommée d'après le manifest.
    await expect(page.getByRole('heading', { name: MANIFEST_FIXTURE_TITLE })).toBeVisible();

    // La carte mène à l'explorateur : la source figure aussi dans sa liste
    // « Sources de données » (liste des sources importées, côté explorateur).
    await page.getByRole('heading', { name: MANIFEST_FIXTURE_TITLE }).click();
    await expect(page).toHaveURL(/\/manifest\?manifestId=/);
    const sourcesList = page.getByRole('region', { name: MANIFEST_GRID });
    await expect(sourcesList.getByRole('heading', { name: NAV_SOURCES })).toBeVisible();
    await expect(sourcesList.getByRole('link', { name: MANIFEST_FIXTURE_TITLE })).toBeVisible();
  });

  test('S2 — collection créée depuis la source, inspectée et persistée', async () => {
    await createCollectionFromSource(page, COLLECTION_NAME);

    // Gestionnaire de collections : une collection, listée, avec son compteur d'éléments.
    await page.goto('/collections');
    await expect(page.getByRole('heading', { name: numberOfCollections(1) })).toBeVisible();
    const collectionRow = page.getByRole('row').filter({ hasText: COLLECTION_NAME });
    await expect(collectionRow).toBeVisible();
    await expect(collectionRow).toContainText(numberOfItems(1));

    // Inspecteur : en-tête « Collection » + nom + compteur, et le canvas de la source.
    await openCollectionInspector(page, COLLECTION_NAME);
    const inspectorHeader = page.getByRole('button', {
      name: new RegExp(`${TITLE_METADATA_COLLECTION}.*${COLLECTION_NAME}`),
    });
    await expect(inspectorHeader).toContainText(COLLECTION_NAME);
    await expect(inspectorHeader).toContainText(numberOfItems(1));
    await expect(page.getByText('Page 1')).toBeVisible();

    // « la source y figure » : afficher le canvas de la collection fait recharger son
    // service IIIF depuis l'hôte de fixture — la source est bien rattachée à la page.
    await displayFixtureCanvas(page);

    // Persistance : après rechargement complet (nouvelle ouverture d'IndexedDB),
    // la collection est toujours listée avec son contenu.
    await page.reload();
    await expect(
      page.getByRole('button', {
        name: new RegExp(`${TITLE_METADATA_COLLECTION}.*${COLLECTION_NAME}`),
      }),
    ).toBeVisible();
    await page.goto('/collections');
    await expect(page.getByRole('heading', { name: numberOfCollections(1) })).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: COLLECTION_NAME })).toContainText(
      numberOfItems(1),
    );
  });
});
