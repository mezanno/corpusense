# Gestion d'État (State Management)

## Analyse Actuelle
Le projet utilise une combinaison de Redux Toolkit (avec Sagas), Zustand et React Query.

## Points d'Amélioration

## Stratégie Adoptée (Mise à jour Janvier 2026)

L'application a migré vers une architecture **Local-First** pour les données persistantes.

### 1. Données Locales : Dexie `useLiveQuery` (Standard)
C'est désormais la méthode standard pour interagir avec IndexedDB de manière réactive.

**État d'avancement :**
- **Collections & Annotations** : Entièrement migré vers `useLiveQuery`.
- **Modèles, Tags & Historique** : Entièrement migré.
- **Workers** : Toujours sous Redux/Sagas (Prochaines étapes).

### 2. Données Distantes : React Query / Axios
Utilisé pour le fetching initial des Manifestes IIIF externes.

### 3. État UI Volatile : Zustand
Utilisé pour les états globaux simples (ex: configuration, sessions temporaires).

### 4. État Système : Redux Toolkit
Redux est maintenu pour la gestion des événements (`events`), le statut des Workers et la file d'attente des Manifestes.

## Bonnes Pratiques Maintenues

### Sélecteurs
L'utilisation de sélecteurs mémosés (Reselect) reste recommandée pour transformer les données issues de `useLiveQuery`.

### Context API
Le Context API est utilisé pour les états locaux de pages complexes (ex: `AnnotationContext`, `CollectionContext`).

