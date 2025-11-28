# Architecture et Structure du Projet

## Vue d'ensemble
Le projet est une application React moderne utilisant Vite comme bundler. L'architecture suit une structure standard mais robuste, adaptée aux applications de taille moyenne à grande.

## Stack Technologique
- **Framework**: React 19
- **Build Tool**: Vite 6
- **Langage**: TypeScript 5.7
- **Styling**: Tailwind CSS 4
- **State Management**: Redux Toolkit (avec Sagas) + Zustand
- **Data Fetching**: React Query + Axios
- **Routing**: React Router 7
- **Testing**: Vitest + React Testing Library
- **Internationalisation**: i18next

## Structure des Dossiers
La structure `src` est bien organisée :
- `components/`: Composants UI réutilisables.
- `pages/`: Vues principales correspondant aux routes.
- `state/`: Gestion d'état (Redux/Zustand).
- `hooks/`: Hooks personnalisés.
- `data/`: Modèles et données statiques.
- `utils/`: Fonctions utilitaires.

## Points d'Amélioration

### 1. Consolidation de la Gestion d'État
L'utilisation simultanée de Redux (avec Sagas) et Zustand peut prêter à confusion.
- **Recommandation**: Clarifier le rôle de chaque gestionnaire d'état. Par exemple, utiliser Redux pour l'état global complexe et asynchrone (si nécessaire) et Zustand pour l'état UI local ou global simple.
- **Alternative**: Migrer davantage de logique de "data fetching" vers React Query (déjà présent) pour réduire la complexité des Sagas.

### 2. Organisation des Composants
Le dossier `components` commence à être chargé.
- **Recommandation**: Adopter une structure plus hiérarchique, par exemple :
  - `components/common/`: Composants génériques (boutons, inputs).
  - `components/features/`: Composants liés à des fonctionnalités spécifiques (ex: `CanvasViewer`, `CollectionManager`).
  - `components/layout/`: Composants de mise en page (Header, Sidebar).

### 3. Gestion des Environnements
Le fichier `vite.config.ts` contient de la logique conditionnelle complexe pour les environnements de test.
- **Recommandation**: Extraire cette configuration dans des fichiers séparés ou utiliser des variables d'environnement plus explicites pour simplifier la configuration principale.
