# Tests et CI/CD

## Analyse Actuelle
Vitest est configuré pour les tests unitaires et d'intégration, ce qui est un excellent choix (rapide et compatible Jest).

## Points d'Amélioration

### 1. Couverture de Tests
- **Recommandation**: Viser une couverture de code critique (logique métier, utilitaires). Utiliser l'outil de couverture de Vitest (`vitest --coverage`) pour identifier les zones non testées.

### 2. Tests End-to-End (E2E)
Il ne semble pas y avoir de configuration explicite pour Cypress ou Playwright.
- **Recommandation**: Ajouter **Playwright** pour les tests E2E. Cela permet de tester les parcours utilisateurs critiques (connexion, navigation, manipulation de canvas) dans de vrais navigateurs. C'est essentiel pour une application complexe manipulant des graphiques (Canvas/Konva).

### 3. Tests Visuels
Pour une application graphique (visualisation de documents), les régressions visuelles sont vite arrivées.
- **Recommandation**: Intégrer des tests de régression visuelle (via Playwright ou Storybook + Chromatic) pour s'assurer que le rendu des composants ne change pas inopinément.

### 4. Intégration Continue (CI)
- **Recommandation**: S'assurer que les commandes `lint`, `type-check` (tsc), et `test` sont exécutées à chaque commit ou Pull Request via GitHub Actions (ou autre CI).
  - Ajouter un step `npm run build` dans la CI pour vérifier que le build de production passe toujours.
