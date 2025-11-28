# Qualité du Code et Bonnes Pratiques

## Analyse Actuelle
Le code est généralement propre et typé, mais certaines pratiques peuvent être améliorées pour la maintenabilité et la robustesse.

## Points d'Amélioration

### 1. Nettoyage du Code (Dead Code & Logs)
Plusieurs fichiers contiennent des `console.log` résiduels (ex: `CollectionInspectorPage.tsx`).
- **Recommandation**: Utiliser un linter rule (`no-console`) plus strict ou un outil de suppression de logs en production. Supprimer les commentaires TODO obsolètes ou les transformer en tickets/issues.

### 2. Typage TypeScript
L'utilisation de `as` (Type Assertion) est présente (ex: `CanvasCard.tsx`).
- **Recommandation**: Privilégier les Type Guards ou les vérifications de nullité explicites.
  ```typescript
  // Au lieu de
  const input = inputRef.current as HTMLInputElement;
  // Préférer
  if (inputRef.current instanceof HTMLInputElement) { ... }
  ```

### 3. Gestion des Formulaires
L'utilisation de `useRef` pour accéder aux valeurs des inputs est observée.
- **Recommandation**: Utiliser `react-hook-form` (déjà dans les dépendances) pour une gestion plus robuste, performante et facile à valider des formulaires, ou à minima des composants contrôlés (`useState`).

### 4. Gestion des Effets (useEffect)
L'utilisation de `useEffect` pour déclencher des chargements de données est courante.
- **Recommandation**: Cela peut entraîner des conditions de course et des rendus multiples. Privilégier l'utilisation de hooks dédiés via React Query (`useQuery`) qui gèrent le cache, le loading et les erreurs nativement.

### 5. Accessibilité (a11y)
Certains éléments interactifs manquent de labels explicites (noté par des TODOs).
- **Recommandation**: Utiliser `eslint-plugin-jsx-a11y` pour détecter automatiquement les problèmes d'accessibilité. S'assurer que tous les boutons et inputs ont des `aria-label` ou des labels visibles.
