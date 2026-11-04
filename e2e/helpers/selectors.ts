// Libellés FR réels utilisés par les specs E2E — valeurs exactes de
// `public/locales/fr` (traduction.json / welcome.json), clé source en commentaire.
//
// Les clés i18n sont stables, les phrases peuvent bouger : un commit de traduction
// ne doit casser qu'un seul fichier (plan Q9 § 3, D-010 : tests par rôles accessibles
// et libellés, jamais par sélecteurs visuels ou `data-testid`).
export const WELCOME_TITLE = 'Bienvenue sur Corpusense'; // welcome.json → title
export const SIDEBAR_TOGGLE = 'Basculer le menu latéral'; // translation.json → sidebar_toggle
export const EMPTY_COLLECTIONS = "Vous n'avez aucune collection actuellement"; // → info_no_collection
export const CREATE_COLLECTION = 'Créer une nouvelle collection'; // → btn_create_collection
export const OPEN_MANIFEST = 'Ouvrir un manifest'; // → btn_open_manifest
export const LOAD_MANIFEST_STEP_1 = '1. Charger un manifest IIIF'; // → title_load_manifest_step_1
export const MANIFEST_INPUT_PLACEHOLDER = 'URL du manifest ou identifiant ARK (Gallica)'; // → form_placeholder_manifest_content
export const ADD_TO_LIBRARY = 'Ajouter à ma bibliothèque'; // → btn_add_manifest_to_library
export const NAV_SOURCES = 'Sources de données'; // → nav_sources

// --- Ajouts étape 3 (S1 : import manifest → bibliothèque) ---
export const ADD_NEW_DOCUMENT = 'Ajouter un nouveau document'; // → btn_add_pdf (carte pointillée des tableaux de bord de sources)
export const PAGE_TITLE_IIIF_STORAGE = 'Bibliothèques en ligne'; // → page_title_iiif_storage
export const LOAD_MANIFEST_STEP_2 = '2. Ajouter le manifest à votre bibliothèque Corpusense'; // → title_load_manifest_step_2
export const BTN_CLOSE = 'Fermer'; // → btn_close (bouton d'annulation du dialogue d'import)
export const MANIFEST_GRID = 'grille des manifests'; // → aria_label_manifest_grid (section de la liste des sources, explorateur)

// --- Ajouts étape 3 (S2 : collection depuis la source, inspecteur) ---
export const CANVAS_GALLERY = 'galerie des canvas'; // → aria_label_canvas_gallery
export const DEFINE_SELECTION_START = 'Définir le début de sélection ici'; // → menu_define_start
export const CREATE_FROM_SELECTION = 'Créer une collection à partir de la sélection'; // → menu_create_from_selection
export const BTN_CREATE = 'Créer'; // → btn_create (confirmation du dialogue de création)
export const COLLECTION_NAME_LABEL = 'Nom de la collection'; // → form_label_collection_name (aussi table_col_title_collection_name)
export const BTN_OPEN = 'Ouvrir'; // → btn_open (œil d'ouverture dans le tableau des collections)
export const TITLE_METADATA_COLLECTION = 'Collection'; // → title_metadata_collection (déclencheur de l'en-tête inspecteur)

// --- Libellés interpolés : gabarits + fabricants ({{number}} est la syntaxe i18next) ---
export const NUMBER_OF_COLLECTIONS = 'Vous avez {{number}} collection(s)'; // → info_number_of_collections
export const NUMBER_OF_ITEMS = '{{number}} élément(s)'; // → info_number_of_items

// --- Ajouts étape 4 (S3 : annotation dans le visualiseur) ---
export const BTN_ADD_ANNOTATION = 'Ajouter une annotation'; // → btn_add_annotation (bascule dessin de la barre d'outils du visualiseur)
export const ANNOTATION_FORM = "formulaire d'annotation"; // → aria_label_annotation_form (section révélée quand une annotation est sélectionnée)
export const ANNOTATION_VALUE_LABEL = 'Valeur'; // → form_label_value (textarea du formulaire d'annotation)
export const BTN_SAVE = 'Enregistrer'; // → btn_save (soumission du formulaire d'annotation)
export const TOAST_ANNOTATION_SAVED = 'Annotation sauvegardée'; // → toast_annotation_saved
export const MENU_DUPLICATE_REGIONS = 'Dupliquer les régions'; // → btn_duplicate_regions (menu contextuel de la vignette, visible quand la collection porte des régions)

// --- Ajouts étape 5 (S4 : export de collection depuis l'inspecteur) ---
export const BTN_EXPORT_COLLECTION = 'Exporter la/les collection(s)'; // → btn_export_collection (nom accessible du bouton d'export de la barre d'outils — via l'attribut `title` — et titre du dialogue)
export const BTN_EXPORT = 'Exporter'; // → btn_export (libellé du bouton de confirmation du dialogue d'export)
export const INCLUDE_ANNOTATIONS = 'Inclure les annotations'; // → form_label_include_annotations (case à cocher, défaut coché)
export const INCLUDE_MANIFEST = 'Inclure un manifest IIIF (canvas + annotations)'; // → form_label_include_manifest (case à cocher, défaut décoché)
export const LOG_EXPORT_COMPLETED = 'Export completed successfully.'; // ⚠️ constante de code (useCollectionIO.tsx), non traduite : message de fin d'export affiché dans le LoggerPanel du dialogue

// --- Contrat DOM de la bibliothèque @annotorious (pas l'implémentation de l'app) ---
// D-010 réserve `data-testid` en dernier recours documenté : ici, aucune cible
// accessible n'expose les formes dessinées elles-mêmes. Le conteneur de l'API
// d'annotation (@annotorious/react, build React 19) est le `svg.a9s-annotationlayer`
// posé sur le canvas OpenSeadragon — c'est l'« overlay annotorious » que le plan Q9
// (étape 4) désigne comme cible d'attente web-first (le drawer WebGL n'émet jamais
// `tile-drawn`). Les formes dessinées portent la classe `a9s-annotation` ; la
// nomenclature `a9s-*` est la surface publique de @annotorious (son CSS distribué).
// Vérifié au spike (2026-10-13) : `role="application"` n'est PAS posé sur ce svg,
// d'où le recours à sa classe — pas un testid maison, un contrat de librairie.
export const ANNOTATION_LAYER = 'svg.a9s-annotationlayer'; // overlay annotorious (conteneur de l'API)
export const ANNOTATION_SHAPE = '.a9s-annotation'; // groupe SVG d'une forme dessinée

export const numberOfCollections = (count: number): string =>
  NUMBER_OF_COLLECTIONS.replace('{{number}}', String(count));

export const numberOfItems = (count: number): string =>
  NUMBER_OF_ITEMS.replace('{{number}}', String(count));
