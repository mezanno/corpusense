# Tests et CI/CD : Politique et Recommandations

## Vue d'ensemble
Actuellement, l'utilisation des tests unitaires est très limitée et de nombreux tests existants sont désactivés. Pour garantir la stabilité de Corpusense, nous adoptons une stratégie structurée axée sur la confiance et la maintenabilité.

---

## 1. Pyramide des Tests

Nous adoptons une structure en trois niveaux pour maximiser l'efficacité :

### A. Tests Unitaires (Vitest) - *Base de la confiance*
- **Cible** : Fonctions pures (`utils/`), transformations de données (`data/models/converters`), et logique métier isolée.
- **Règle** : Tout nouvel utilitaire ou service de conversion **doit** avoir ses tests unitaires associés.
- **Outil** : Vitest (configuré et rapide).

### B. Tests de Composants et Hooks (Vitest + React Testing Library)
- **Cible** : Composants UI complexes (ex: `CanvasCard`, `AnnotationOrderPanel`) et hooks personnalisés (ex: `useCollections`).
- **Objectif** : Tester les interactions utilisateur et le rendu conditionnel sans dépendre d'une infrastructure complète.
- **Mocks** : Utiliser `MSW` (Mock Service Worker) pour intercepter les appels API externes.

### C. Tests End-to-End (E2E) (Playwright) - *Validation des Parcours*
- **Cible** : Parcours utilisateur critiques (ex: Import de manifeste -> Création de collection -> Annotation).
- **Action** : Ajouter **Playwright** au projet pour tester les interactions réelles dans un navigateur (essentiel pour les graphiques Canvas/Konva).

---

## 2. Standards et Conventions de Développement

- **Nommage** : Les fichiers doivent être nommés `*.test.ts` ou `*.test.tsx` et situés dans un sous-dossier `__tests__`.
- **Méthode AAA** :
    - **Arrange** : Préparer les données et mocks.
    - **Act** : Exécuter l'action.
    - **Assert** : Vérifier le résultat.
- **Tests Visuels** : Pour prévenir les régressions graphiques, intégrer des tests de capture (via Playwright) sur les composants de visualisation majeurs.

---

## 3. Priorités d'Implémentation (Roadmap)

1.  **Réactivation** : Réactiver et corriger les tests unitaires existants (actuellement obsolètes ou commentés).
2.  **Logic Métier** : Couvrir 100% du dossier `src/data/utils/` (calculs IIIF, gestion des collections).
3.  **Hooks DAL** : Créer des tests pour les hooks utilisant `useLiveQuery` (ex: `useCollections`).
4.  **CI/CD** : Automatiser l'exécution des tests sur chaque Pull Request.

---

## 4. Intégration Continue (CI)

Les tests doivent être automatisés via GitHub Actions (ou équivalent) :
- **Validation** : Les commandes `npm run lint`, `npm run type-check` et `npm run test` doivent passer pour autoriser une fusion.
- **Build de Production** : Interdire le build si la suite de tests échoue.
- **Couverture** : Utiliser `vitest --coverage` pour identifier les zones non testées, sans viser un pourcentage arbitraire mais en priorisant les fichiers avec une logique complexe.

---

## 5. Outils Recommandés

- **MSW (Mock Service Worker)** : Pour simuler proprement les API externes (APIs IIIF, Mistral).
- **Playwright** : Pour les tests de bout en bout et les tests de régression visuelle.
- **Coverage Vitest** : Pour le suivi de la qualité du code.
