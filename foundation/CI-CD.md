# CI-CD

## Pipeline observée (OBSERVED)

Deux workflows GitHub Actions, pensés comme un système unique :

```text
ci.yml   (workflow réutilisable : PR + appel)
  validate : tsc -b → vitest → prettier --check → eslint ratchet (baseline) → npm audit (non bloquant)
  e2e      : Playwright chromium, PR uniquement, rapport téléversé au 1er échec seulement
deploy.yml (push develop)
  validate (utilise ci.yml) → build (variables vérifiées AVANT build) → publish (Pages)
```

Pratiques observées, toutes transférables à n'importe quel système de CI :

1. **Le déploiement est conditionné par la validation** : `deploy.yml` appelle `ci.yml` en job réutilisable — une seule source de vérité, pas de double exécution, pas de push non validé publiable.
2. **`permissions: {}` par défaut**, chaque job demande exactement ses droits (`contents: read`, `pages: write`, `id-token: write`).
3. **Actions épinglées par SHA** avec commentaire de version — protection supply-chain de base.
4. **Concurrency avec `cancel-in-progress`** : les validations obsolètes s'annulent d'elles-mêmes.
5. **Cache de dépendances et de binaires de test** indexés sur le lockfile.
6. **Vérification des variables de build avant le build** : une variable manquante fait échouer tôt avec un message d'erreur actionnable (les variables sont des _variables de dépôt_, publiques par design, pas des secrets).
7. **Audit de dépendances présent mais non bloquant**, assorti d'une décision documentée (dette connue, à résorber) — un check bloquant ignoré par `continue-on-error` sans trace serait pire.
8. **Ratchet de lint comme gate** : la dette héritée est chiffrée dans un fichier versionné ; la CI compare et bloque la dérive (voir PATTERNS P8).
9. **E2E exécuté sur PR mais sauté dans l'appel réutilisable du deploy** : sa réussite ne bloque effectivement la fusion que si la protection de branche l'impose.
10. **Runtime épinglé** (Node 22) **et package manager épinglé** (`packageManager` dans le manifest + installation explicite du npm attendu dans la CI) — l'écart lockfile/runner est traité comme une cause d'échec connue, pas comme un hasard.
11. Artefacts téléversés **en cas d'échec du job**, après les éventuelles tentatives, rétention courte (7 jours).

La protection de branches rendant ces checks bloquants à la fusion est un réglage externe à vérifier par dépôt (roadmap Q3) — à prévoir dès le premier jour dans un nouveau projet.

## Pipeline de référence indépendante du langage (RECOMMENDED)

Étapes conceptuelles, commandes propres à la cible :

```text
Validate   typecheck/analyse statique → tests unitaires+intégration → format → lint (ratchet) → audit deps
Build      génération des métadonnées de version → compilation/bundle
Security   (si exposé) vérif variables obligatoires → audit/scan → SBOM optionnel
Package    artefact unique versionné (version+hash+date injectés au build, jamais commités)
Publish    publication statique ou registre, sous condition d'artefact de Validate
```

Règles transversales à reprendre telles quelles :

- Valider avant de builder ; builder avant de publier ; chaque étape ne demande que ses permissions.
- Un job de qualité qui échoue doit pointer une ligne exploitable (le ratchet affiche `N erreurs / baseline M`).
- Environnement de test déterministe : faux moteurs, fixtures locales, zéro appel réseau sortant dans les tests (la CI ne doit pas dépendre d'un service tiers).
- Deux canaux de publication (stable / test) via branches ou environments séparés — le source le fait avec `main`/`develop` + fourche, transposable à tout hôte Git.
