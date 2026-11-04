import { BrowserContext, Page, expect, test } from '@playwright/test';
import { E2E_ORIGIN } from './helpers/config';
import { StoredAnnotation, readStoredAnnotations } from './helpers/indexeddb';
import {
  createCollectionFromSource,
  displayFixtureCanvas,
  drawControlRectangle,
  importFixtureManifest,
  openCollectionInspector,
  saveAnnotationValue,
} from './helpers/journeys';
import { installE2ENetwork } from './helpers/network';
import {
  ANNOTATION_FORM,
  ANNOTATION_LAYER,
  ANNOTATION_SHAPE,
  ANNOTATION_VALUE_LABEL,
  MENU_DUPLICATE_REGIONS,
  TITLE_METADATA_COLLECTION,
} from './helpers/selectors';

// Étape 4 du plan Q9 — scénario S3 : annotation rectangulaire dessinée dans le
// visualiseur de la collection, visible, éditable, persistée (Dexie/IndexedDB),
// relue après rechargement complet de la page.
//
// L'état initial est RECONSTRUIT à chaque exécution par le parcours S1+S2 rejoué
// (`helpers/journeys.ts`) : IndexedDB est vierge par contexte, aucune donnée
// partagée entre specs. Comme en étape 3, les tests partagent un seul contexte
// (créé dans `beforeAll`) pour que la collection, puis l'annotation, survivent
// d'un test à l'autre de la série.
//
// Enseignements intégrés (spike dessin du 2026-10-13, voir selectors.ts) :
// - attente web-first de « tuile rendue » par le RÉSEAU (`displayFixtureCanvas` :
//   info.json puis l'image de tuile), le drawer WebGL de l'app n'émettant jamais
//   `tile-drawn` ; l'overlay annotorious visé est `svg.a9s-annotationlayer` ;
// - dessin au geste souris déterministe autour du centre de la couche : au niveau
//   d'ouverture l'app est figée par `Viewport.reset` → `goHome(true)` (aucune
//   animation résiduelle) sur le `defaultZoomLevel: 0.5` de l'app, l'image 1024×768
//   occupant ~512×384 px centrés dans la couche (498 px de large). Le rectangle
//   dessiné (200×140 centrés) a donc pour centre EXACT le centre de la couche, ce
//   qui permet de le rouvrir au clic après rechargement sans dépendre du DOM ;
// - `autoSave` : la fin du geste déclenche `createAnnotation` → l'app enregistre
//   dans Dexie puis revient en navigation (la bascule se dé-active) ET laisse la
//   forme sélectionnée, ce qui révèle le formulaire d'annotation sans clic ;
// - APRÈS RECHARGEMENT, l'app recharge bien l'annotation dans son store réactif
//   (menu contextuel « Dupliquer les régions ») et dans annotorious (le clic sur sa
//   position ouvre le formulaire, valeur restaurée), MAIS ne recrée pas le nœud DOM
//   `.a9s-annotation` au remontage (le drawer WebGL peint sur un canvas ; le groupe
//   SVG n'est régénéré qu'à l'interaction). La preuve visible du reload s'appuie
//   donc sur le menu contextuel accessible et le formulaire, pas sur le nœud SVG.

/** Nom de la collection (mêmes données de parcours que l'étape 3). */
const COLLECTION_NAME = 'Collection E2E Q9';

/** Valeur saisie dans le formulaire d'annotation (preuve de contenu persisté). */
const ANNOTATION_VALUE = 'Région de contrôle E2E';

test.describe.serial('annotation persistée dans le visualiseur', () => {
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

  test('préparation — S1+S2 rejoués : la source, la collection et la tuile de fixture', async () => {
    await importFixtureManifest(page);
    await createCollectionFromSource(page, COLLECTION_NAME);
    await openCollectionInspector(page, COLLECTION_NAME);
    await displayFixtureCanvas(page);

    // Le visualiseur est ouvert sur la tuile rendue et l'annotateur est monté
    // (overlay @annotorious), sans annotation : point de départ du dessin.
    await expect(page.locator(ANNOTATION_LAYER)).toBeVisible();
    await expect(page.locator(ANNOTATION_SHAPE)).toHaveCount(0);
  });

  test('S3 — le rectangle dessiné à la souris est visible, persisté et éditable', async () => {
    // Geste déterministe et retour en navigation (autoSave) : extraits dans
    // `journeys.drawControlRectangle`, partagés avec le scénario S4 (export).
    await drawControlRectangle(page);

    // Persistance bas niveau : une ligne dans `mezanno/annotations`, rattachée à
    // notre collection/canvas, de type TEXT_REGION (D-004, preuve Dexie directe).
    await expect
      .poll(async () => (await readStoredAnnotations(page)).length, {
        message: 'annotation absente d’IndexedDB',
        timeout: 10_000,
      })
      .toBe(1);
    const drawn: StoredAnnotation[] = await readStoredAnnotations(page);
    expect(drawn[0]?.collectionId).toBeTruthy();
    expect(drawn[0]?.canvasId).toBeTruthy();
    expect(drawn[0]?.type).toBe('TEXT_REGION');

    // Saisie d'une valeur via le formulaire (révélé par la sélection automatique de
    // la forme) puis enregistrement : la valeur est relue depuis IndexedDB.
    await saveAnnotationValue(page, ANNOTATION_VALUE);
    await expect
      .poll(async () => (await readStoredAnnotations(page))[0]?.value, {
        message: 'valeur de l’annotation non persistée',
        timeout: 10_000,
      })
      .toBe(ANNOTATION_VALUE);
  });

  test('S3 — l’annotation survit au rechargement complet de la page', async () => {
    await page.reload();

    // L'inspecteur est rétabli par la route ; le canvas n'est pas réaffiché
    // d'office : on le rouvre comme un utilisateur, tuile rechargée à l'appui.
    await expect(
      page.getByRole('button', {
        name: new RegExp(`${TITLE_METADATA_COLLECTION}.*${COLLECTION_NAME}`),
      }),
    ).toBeVisible();
    await displayFixtureCanvas(page);
    await expect(page.locator(ANNOTATION_LAYER)).toBeVisible();

    // Preuve visible (rôle accessible) : l'annotation TEXT_REGION est rechargée depuis
    // IndexedDB dans le contexte — le menu de la vignette propose « Dupliquer les
    // régions », qui n'apparaît que lorsque la collection porte des régions.
    await page
      .getByRole('listitem')
      .filter({ hasText: 'Page 1' })
      .first()
      .click({ button: 'right' });
    await expect(page.getByRole('menuitem', { name: MENU_DUPLICATE_REGIONS })).toBeVisible();
    await page.keyboard.press('Escape');

    // Preuve visible + contenu : un clic à l'endroit déterministe de l'annotation
    // (centre de la couche, là où elle a été dessinée) rouvre le formulaire, dont le
    // champ « Valeur » porte la valeur enregistrée avant le rechargement.
    const layer = await page.locator(ANNOTATION_LAYER).boundingBox();
    if (layer === null) {
      throw new Error('couche d’annotation introuvable après rechargement');
    }
    const form = page.getByRole('region', { name: ANNOTATION_FORM });
    await expect
      .poll(
        async () => {
          await page.mouse.click(layer.x + layer.width / 2, layer.y + layer.height / 2);
          return form.isVisible().catch(() => false);
        },
        { message: 'le clic sur l’annotation doit rouvrir le formulaire', timeout: 10_000 },
      )
      .toBe(true);
    await expect(form.getByRole('textbox', { name: ANNOTATION_VALUE_LABEL })).toHaveValue(
      ANNOTATION_VALUE,
    );

    // Preuve bas niveau sobre : toujours une seule annotation, valeur inchangée.
    const stored: StoredAnnotation[] = await readStoredAnnotations(page);
    expect(stored).toHaveLength(1);
    expect(stored[0]?.value).toBe(ANNOTATION_VALUE);
  });
});
