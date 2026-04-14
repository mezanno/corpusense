# Architecture et Structure du Projet

## Vue d'ensemble

Le projet est une application React moderne utilisant Vite comme bundler. L'architecture suit une structure standard mais robuste, adaptée aux applications de taille moyenne à grande.

## Stack Technologique (Mise à jour Janvier 2026)

- **Framework**: React 19.2
- **Build Tool**: Vite 7.2
- **Langage**: TypeScript 5.9
- **Styling**: Tailwind CSS 4.1
- **State Management**: Dexie `useLiveQuery` (Local-First) + Redux Toolkit (Legacy/Shared) + Zustand (UI state)
- **Data Fetching**: React Query 5 (External APIs)
- **Routing**: React Router 7.1
- **Testing**: Vitest + React Testing Library
- **Internationalisation**: i18next

## Structure des Dossiers

La structure `src` est organisée comme suit :

- `components/`: Composants UI (en attente de restructuration feature-first).
- `pages/`: Vues principales de l'application.
- `state/`: Gestion d'état (Redux, Zustand).
- `hooks/`: Hooks personnalisés, incluant la DAL réactive (`hooks/data`).
- `data/`: Modèles et Repositories (DAL).

## Points d'Amélioration et État d'Avancement

### 1. Consolidation de la Gestion d'État (EN COURS)

La migration vers une approche **Local-First** via `useLiveQuery` est bien avancée.

- **Réussite** : Les collections, annotations et tags sont désormais gérés via des hooks réactifs sur IndexedDB. La gestion des Workers a été migrée vers `useJobRealtime` (Supabase + Polling).
- **Reste à faire** : Migrer la file d'attente d'import des Manifestes pour vider totalement Redux-Saga.

### 2. Organisation des Composants (À FAIRE)

Le dossier `components` reste plat et commence à être difficile à maintenir.

- **Recommandation maintenue** : Adopter la structure détaillée dans le document **[07-Component-Structure-Proposal.md](./07-Component-Structure-Proposal.md)**.

### 3. Gestion des Environnements (TERMINÉ)

La configuration Vite a été stabilisée pour supporter les tests et le multi-thread via les Workers.
