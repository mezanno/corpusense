# Optimisation des Performances

## Analyse Actuelle
L'application utilise déjà des techniques avancées comme la virtualisation (`react-window`) pour les grandes listes, ce qui est excellent.

## Points d'Amélioration

### 1. Chargement des Images
Le composant `CanvasCard` charge les thumbnails via un `useEffect`.
- **Problème**: Si une grille affiche 50 cartes, cela lance 50 requêtes simultanées + le traitement JS.
- **Recommandation**:
  - Utiliser le "Lazy Loading" natif des images (`loading="lazy"`).
  - Utiliser un composant d'image optimisé qui gère le placeholder et le chargement progressif.
  - Regrouper les requêtes si possible ou utiliser un gestionnaire de cache d'images.

### 2. Code Splitting et Bundle Size
Vite est configuré avec des `manualChunks`.
- **Recommandation**: Analyser le bundle avec `rollup-plugin-visualizer` (déjà présent) pour identifier les gros modules.
- **Action**: Vérifier si des bibliothèques lourdes (comme `pdfjs-dist` ou `konva`) sont chargées uniquement lorsque nécessaire via `React.lazy` et `Suspense`.

### 3. Rendu React
- **Recommandation**: Utiliser `React.memo` pour les composants purement présentationnels qui sont rendus fréquemment dans des listes (comme `GridCell` ou `CanvasCard`) pour éviter les re-rendus inutiles si les props ne changent pas.
- **Action**: Vérifier les re-rendus avec le React DevTools Profiler.

### 4. Logger en Production
Le middleware `redux-logger` semble être inclus sans condition stricte.
- **Recommandation**: S'assurer qu'il est exclu du build de production pour éviter de ralentir l'application et de fuiter des données dans la console.
  ```typescript
  if (process.env.NODE_ENV !== 'production') {
    middleware.push(logger);
  }
  ```
