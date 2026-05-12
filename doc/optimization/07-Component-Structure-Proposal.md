# Proposition de Restructuration des Composants

Actuellement, le dossier `components` contient un mélange de composants UI génériques, de composants métier spécifiques et de dossiers techniques. Une structure plus hiérarchique facilitera la navigation et la maintenabilité.

## Structure Proposée

L'idée est de séparer les composants en trois catégories principales :
1.  **`ui/`** : Composants de base, atomiques et sans logique métier (boutons, inputs, cartes). C'est déjà le cas avec votre dossier `ui` actuel (shadcn/ui).
2.  **`common/`** : Composants réutilisables dans toute l'application mais plus complexes que de simples atomes (ex: `Loading`, `EmptyState`).
3.  **`layout/`** : Composants structurants de la page (Sidebar, Header).
4.  **`features/`** : Composants liés à un domaine métier spécifique (Collections, Manifestes, Workers, etc.).

### Arborescence Détaillée

```text
src/
└── components/
    ├── ui/                     # (Existant) Composants shadcn/ui (Button, Dialog, etc.)
    │
    ├── common/                 # Composants génériques partagés
    │   ├── Loading.tsx         # (Déplacé depuis racine)
    │   ├── NothingToShow.tsx   # (Déplacé depuis racine)
    │   ├── ScopeLabel.tsx      # (Déplacé depuis racine)
    │   └── forms/              # (Existant) Formulaires génériques
    │
    ├── layout/                 # Structure de l'application
    │   ├── DocSideBar.tsx      # (Déplacé depuis racine)
    │   ├── HistoryNav.tsx      # (Déplacé depuis racine)
    │   ├── ToolBar.tsx         # (Déplacé depuis racine)
    │   └── drawers/            # (Existant) Drawers de navigation/layout
    │
    └── features/               # Composants Métier (Domain Driven)
        ├── annotations/
        │   └── AnnotationOrderPanel.tsx
        │
        ├── canvas/
        │   ├── Viewer/         # (Anciennement dossier canvasViewer)
        │   └── QuickCanvasViewer.tsx
        │
        ├── collections/
        │   ├── CanvasCard.tsx
        │   ├── CanvasGallery.tsx
        │   ├── CollectionToolbar.tsx
        │   └── GridThumb.tsx
        │
        ├── documentation/
        │   └── DocumentationContent.tsx
        │
        ├── entities/
        │   ├── Entities.tsx
        │   └── EntityViewer.tsx
        │
        ├── manifests/
        │   ├── LocalManifestBrowser.tsx
        │   ├── ManifestDetails.tsx
        │   └── NoManifestToShow.tsx
        │
        ├── metadata/
        │   ├── MetadataTable.tsx
        │   └── metadata.css
        │
        ├── models/
        │   └── ModelViewer.tsx
        │
        ├── text/
        │   └── Viewer/         # (Anciennement dossier textviewer)
        │
        └── workers/
            ├── WorkerDataTable.tsx
            ├── WorkerDetails.tsx
            ├── WorkerLabel.tsx
            ├── WorkerSelector.tsx
            ├── WorkerStatusIcon.tsx
            └── utils.tsx       # (Anciennement workerUtils.tsx)
```

## Avantages de cette structure

1.  **Scalabilité** : Quand vous ajoutez une nouvelle fonctionnalité (ex: "Search"), vous créez simplement un nouveau dossier dans `features/search/` sans polluer la racine.
2.  **Clarté** : On distingue immédiatement ce qui est de l'UI pure (`ui/`) de ce qui contient de la logique métier (`features/`).
3.  **Colocation** : Les styles CSS ou les sous-composants spécifiques à une feature restent groupés avec elle (ex: `metadata.css` avec `MetadataTable`).

## Étapes de Migration

1.  Créer les dossiers `common`, `layout` et `features`.
2.  Déplacer les fichiers un par un (ou par groupe) en mettant à jour les imports.
    *   *Note : VS Code gère souvent la mise à jour des imports automatiquement lors du déplacement de fichiers.*
3.  Vérifier que les alias de chemin (ex: `@/components/...`) fonctionnent toujours correctement.
