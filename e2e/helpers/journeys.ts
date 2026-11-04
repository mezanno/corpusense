import { Page, expect } from '@playwright/test';
import { E2E_IMAGE_SERVICE_URL, E2E_MANIFEST_URL } from './fixtures';
import {
  ADD_NEW_DOCUMENT,
  ADD_TO_LIBRARY,
  ANNOTATION_FORM,
  ANNOTATION_LAYER,
  ANNOTATION_SHAPE,
  ANNOTATION_VALUE_LABEL,
  BTN_ADD_ANNOTATION,
  BTN_CLOSE,
  BTN_CREATE,
  BTN_EXPORT_COLLECTION,
  BTN_OPEN,
  BTN_SAVE,
  CANVAS_GALLERY,
  COLLECTION_NAME_LABEL,
  CREATE_COLLECTION,
  CREATE_FROM_SELECTION,
  DEFINE_SELECTION_START,
  LOAD_MANIFEST_STEP_1,
  LOAD_MANIFEST_STEP_2,
  MANIFEST_INPUT_PLACEHOLDER,
  OPEN_MANIFEST,
  PAGE_TITLE_IIIF_STORAGE,
  TITLE_METADATA_COLLECTION,
  TOAST_ANNOTATION_SAVED,
} from './selectors';

// Parcours réutilisables extraits de l'étape 3 (S1 + S2) pour que les scénarios
// suivants (S3 annotation, S4 export) rejouent le même état initial sans re-coder
// les gestes. Chaque fonction est auto-suffisante : elle navigue, agit, et attend
// sa post-condition web-first (jamais de délai temporel).

/** Titre du manifest de fixture (`e2e/fixtures/manifest.json` → `label`). */
export const MANIFEST_FIXTURE_TITLE = 'Manifeste de test E2E';

/**
 * S1 — import du manifest de fixture depuis « Bibliothèques en ligne »
 * (seule porte d'entrée de OpenManifestForm) jusqu'à la carte de source en
 * bibliothèque. Le nom est SAISI (et non laissé au placeholder proposé) pour que
 * le nom stocké soit déterministe (enseignement spike S1).
 */
export async function importFixtureManifest(page: Page): Promise<void> {
  await page.goto('/iiifSources');
  await expect(
    page.getByRole('heading', { level: 1, name: PAGE_TITLE_IIIF_STORAGE }),
  ).toBeVisible();

  // Carte pointillée « ajouter un document » → dialogue d'import (étape 1).
  await page.getByText(ADD_NEW_DOCUMENT).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog.getByText(LOAD_MANIFEST_STEP_1)).toBeVisible();
  await expect(dialog.getByRole('button', { name: BTN_CLOSE })).toBeVisible();

  await dialog.getByRole('textbox', { name: MANIFEST_INPUT_PLACEHOLDER }).fill(E2E_MANIFEST_URL);
  const loadButton = dialog.getByRole('button', { name: OPEN_MANIFEST });
  await expect(loadButton).toBeEnabled();
  await loadButton.click();

  // Étape 2 : le manifest chargé est présenté, son nom est proposé au champ de renommage.
  await expect(dialog.getByText(LOAD_MANIFEST_STEP_2)).toBeVisible();
  const nameField = dialog.getByRole('textbox', { name: MANIFEST_FIXTURE_TITLE });
  await expect(nameField).toBeVisible();
  await nameField.fill(MANIFEST_FIXTURE_TITLE);

  const addToLibrary = dialog.getByRole('button', { name: ADD_TO_LIBRARY });
  await expect(addToLibrary).toBeEnabled();
  await addToLibrary.click();

  // Le dialogue se ferme de lui-même une fois la source persistée (Dexie).
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { name: MANIFEST_FIXTURE_TITLE })).toBeVisible();
}

/**
 * S2 (partie création) — depuis la bibliothèque : ouvrir l'explorateur de la
 * source importée, sélectionner le canvas unique, créer une collection nommée
 * depuis la sélection. Le nom est saisi au clavier (`pressSequentially`) :
 * `fill` n'active pas la validation react-hook-form du dialogue (enseignement
 * spike S2) et ce geste reproduit l'usage réel.
 */
export async function createCollectionFromSource(
  page: Page,
  collectionName: string,
): Promise<void> {
  await page.goto('/iiifSources');
  const sourceCard = page.getByRole('heading', { name: MANIFEST_FIXTURE_TITLE });
  await expect(sourceCard).toBeVisible();
  await sourceCard.click();
  await expect(page).toHaveURL(/\/manifest\?manifestId=/);

  // Sélection du canvas unique dans la galerie (clic droit → « définir le début »).
  const gallery = page.getByRole('region', { name: CANVAS_GALLERY });
  const canvasItem = gallery.getByRole('listitem').first();
  await expect(canvasItem).toBeVisible();
  await canvasItem.click({ button: 'right' });
  await page.getByRole('menuitem', { name: DEFINE_SELECTION_START }).click();

  // Second clic droit : le menu propose désormais la création depuis la sélection.
  await canvasItem.click({ button: 'right' });
  await page.getByRole('menuitem', { name: CREATE_FROM_SELECTION }).click();

  // Dialogue « Créer une nouvelle collection ».
  const dialog = page.getByRole('alertdialog');
  await expect(dialog.getByRole('heading', { name: CREATE_COLLECTION })).toBeVisible();
  const collectionNameField = dialog.getByRole('textbox', { name: COLLECTION_NAME_LABEL });
  await collectionNameField.click();
  await collectionNameField.pressSequentially(collectionName);
  const createButton = dialog.getByRole('button', { name: BTN_CREATE, exact: true });
  await expect(createButton).toBeEnabled();
  await createButton.click();
  await expect(dialog).toBeHidden();
}

/**
 * Ouvre l'inspecteur de la collection nommée depuis le gestionnaire
 * (/collections → ligne → « Ouvrir ») et attend l'en-tête d'inspecteur.
 */
export async function openCollectionInspector(page: Page, collectionName: string): Promise<void> {
  await page.goto('/collections');
  const collectionRow = page.getByRole('row').filter({ hasText: collectionName });
  await expect(collectionRow).toBeVisible();
  await collectionRow.getByRole('button', { name: BTN_OPEN }).click();
  await expect(page).toHaveURL(/\/collections\/[0-9a-f-]+/);
  await expect(
    page.getByRole('button', {
      name: new RegExp(`${TITLE_METADATA_COLLECTION}.*${collectionName}`),
    }),
  ).toContainText(collectionName);
}

/**
 * Affiche le canvas de la fixture (« Page 1 », libellé du manifest de test) dans
 * le visualiseur de l'inspecteur, et attend que la tuile unique soit réellement
 * chargée : `info.json` puis l'image de tuile (service IIIF de fixture servi en
 * interception). Web-first, sans événement `tile-drawn` que le drawer WebGL de
 * l'app n'émet jamais (enseignement spike OSD).
 */
export async function displayFixtureCanvas(page: Page): Promise<void> {
  const infoRequest = page.waitForResponse(
    (response) =>
      response.url() === `${E2E_IMAGE_SERVICE_URL}/info.json` && response.status() === 200,
  );
  await page.getByRole('listitem').filter({ hasText: 'Page 1' }).first().click();
  await infoRequest;
  const tileRequest = page.waitForResponse(
    (response) =>
      response.url().startsWith(`${E2E_IMAGE_SERVICE_URL}/`) &&
      response.url().endsWith('.jpg') &&
      response.status() === 200,
  );
  await tileRequest;
}

/**
 * S3 (partie dessin) — dessine le rectangle de contrôle dans le visualiseur
 * ouvert sur le canvas de fixture. Geste déterministe extrait de la spec S3 :
 * au niveau d'ouverture l'app est figée par `Viewport.reset` → `goHome(true)`
 * sur le `defaultZoomLevel: 0.5`, l'image 1024×768 occupant ~512×384 px centrés
 * dans la couche ; le rectangle (200×140) a donc pour centre EXACT le centre de
 * la couche, ce qui permet de le retrouver au clic sans dépendre du DOM.
 * `autoSave` : la fin du geste déclenche `createAnnotation` → l'app enregistre
 * dans Dexie, revient en navigation (la bascule se dé-active) et laisse la forme
 * sélectionnée, ce qui révèle le formulaire d'annotation.
 * Post-condition : exactement une forme dessinée, bascule revenue en navigation.
 */
export async function drawControlRectangle(page: Page): Promise<void> {
  const drawToggle = page.getByRole('button', { name: BTN_ADD_ANNOTATION });
  await expect(drawToggle).toHaveAttribute('aria-pressed', 'false');
  await drawToggle.click();
  await expect(drawToggle).toHaveAttribute('aria-pressed', 'true');

  const layer = await page.locator(ANNOTATION_LAYER).boundingBox();
  if (layer === null) {
    throw new Error('couche d’annotation introuvable avant le dessin');
  }
  const centerX = layer.x + layer.width / 2;
  const centerY = layer.y + layer.height / 2;
  await page.mouse.move(centerX - 100, centerY - 70);
  await page.mouse.down();
  await page.mouse.move(centerX - 90, centerY - 60, { steps: 3 });
  await page.mouse.move(centerX + 100, centerY + 70, { steps: 8 });
  await page.mouse.up();

  await expect
    .poll(async () => await drawToggle.getAttribute('aria-pressed'), {
      message: 'le dessin doit déclencher la création (retour en navigation)',
      timeout: 10_000,
    })
    .toBe('false');
  await expect(page.locator(ANNOTATION_SHAPE)).toHaveCount(1);
}

/**
 * S3 (partie formulaire) — saisit une valeur dans le formulaire d'annotation
 * révélé par la sélection automatique de la forme qui vient d'être créée
 * (`autoSave`), puis enregistre. La saisie se fait au clavier réel
 * (`pressSequentially`) : enseignement des spikes S2/S3, `fill` ne valide pas
 * react-hook-form.
 * Post-condition : toast de sauvegarde visible (la relecture IndexedDB est à la
 * charge de l'appelant, qui connaît sa donnée).
 */
export async function saveAnnotationValue(page: Page, value: string): Promise<void> {
  const form = page.getByRole('region', { name: ANNOTATION_FORM });
  await expect(form).toBeVisible();
  const valueField = form.getByRole('textbox', { name: ANNOTATION_VALUE_LABEL });
  await valueField.click();
  await valueField.pressSequentially(value);
  await form.getByRole('button', { name: BTN_SAVE, exact: true }).click();
  await expect(page.getByText(TOAST_ANNOTATION_SAVED)).toBeVisible();
}

/**
 * S1→S3 en chaîne — reconstruit l'état utile aux scénarios aval (export S4) :
 * import du manifest de fixture, collection nommée depuis la source, ouverture
 * de l'inspecteur, affichage du canvas, rectangle de contrôle dessiné et valeur
 * enregistrée. Post-condition : toast de sauvegarde visible ; la relecture
 * IndexedDB (preuve de contenu) reste à la charge de l'appelant.
 */
export async function createAnnotatedCollection(
  page: Page,
  collectionName: string,
  annotationValue: string,
): Promise<void> {
  await importFixtureManifest(page);
  await createCollectionFromSource(page, collectionName);
  await openCollectionInspector(page, collectionName);
  await displayFixtureCanvas(page);
  await drawControlRectangle(page);
  await saveAnnotationValue(page, annotationValue);
}

/**
 * Ouvre le dialogue d'export depuis la barre d'outils de l'inspecteur (bouton
 * d'export, dont le nom accessible vient de l'attribut `title` — l'attribut
 * `aria-label` posé par le composant est une coquille non valide en ARIA).
 * Post-condition : dialogue « Exporter la/les collection(s) » visible.
 */
export async function openExportDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: BTN_EXPORT_COLLECTION }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog.getByRole('heading', { name: BTN_EXPORT_COLLECTION })).toBeVisible();
}
