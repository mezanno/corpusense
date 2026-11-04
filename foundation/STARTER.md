# STARTER

Spécification du starter d'un nouveau projet bâti sur ces fondations. **Aucune stack cible n'est fixée** : chaque section nomme le principe et les points de choix. Les exemples entre parenthèses sont des illustrations d'écosystèmes, pas des recommandations.

## 1. Points de choix à trancher avant le premier commit

| #   | Choix                                                                             | Contraintes héritées des fondations                                                                                                                                                                 |
| --- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | Domaine : réutiliser le domaine CorpuSense (IIIF/annotation) ou nouveau domaine ? | Le vocabulaire (DOMAIN) ne se transpose que si le domaine est gardé ; sinon réécrire `CONTEXT.md`                                                                                                   |
| C2  | Moteur de persistance : local-first (navigateur/embarqué) ou client-serveur ?     | Si local-first : il faut un **moteur observable** (abonnements) et transactionnel. Sinon : prévoir une file d'événements locale pour garder le flux réactif                                         |
| C3  | Framework d'interface                                                             | Doit permettre : abonnement de vue à un flux, contexte par écran, routes avec base-path configurable                                                                                                |
| C4  | Mécanisme d'orchestration asynchrone                                              | Le moteur de file headless à ports (P6) est la cible ; l'orchestrateur n'est jamais une dépendance du domaine                                                                                       |
| C5  | Langage/typage                                                                    | Le Result Pattern, les alphabets clos et les tables totales exigent un **typage statique avec union discriminée ou enums exhaustifs** ; à défaut, prévoir des tests de contrat remplaçant le typage |
| C6  | Distribution : statique sous sous-répertoire ? PWA/offline ?                      | Le source est un bundle statique publiable sous sous-chemin ; à garder seulement si pertinent                                                                                                       |

## 2. Arborescence conceptuelle (transposable à tout layout)

```text
src/
  interface/        écrans, composants, navigation, tables de présentation (tables d'enum totales)
  application/      moteur de file (run(worker, plugin, ports)), registre de plugins, commandes
  domain/           entités + schémas de validation, DTO d'écriture, LOIS PURES (statuts, invariants)
  infrastructure/   adaptateurs : persistance (vrai + faux moteur), services externes, notifieur, horloge
  platform/         configuration (build-time vs runtime), i18n, logging (module unique), erreurs (BaseError, Result)
tests intégrés par colocalisation (__tests__/) pour l'unitaire ; e2e/ dédié pour les parcours
docs/               README, architecture.md (daté « vérifié contre le code »), DECISIONS.md, roadmap.md, securite.md
CONTEXT.md          glossaire du domaine avec _Avoid_
```

Règles de dépôt (à rendre mécaniques) : `domain` n'importe rien de technique ; `interface` n'importe pas `infrastructure` ; une seule destination par famille de helpers (pas de `utils/` multiple).

## 3. Stack — principes de choix

- **Erreurs** : le socle = type Result + hiérarchie d'erreurs à contexte + règle de lint anti-erreur-nue. (TS : union discriminée + ESLint AST ; Rust : `Result`/`thiserror` natifs — la cible doit pouvoir exprimer les trois.)
- **Persistance** : ORM/moteur avec **migrations versionnées + abonnements + transactions** ; faux moteur fidèle disponible pour les tests.
- **Validation** : un seul schéma par entité, d'où découle le type, servant aussi à valider tout import.
- **UI** : primitives accessibles sans logique métier (le source utilise Radix/shadcn ; l'exigence transposable est « rôles accessibles natifs », condition du contrat de test sans testid).
- **i18n** : clés + backend de chargement + mock renvoyant les clés en test.

## 4. Configuration

- Fichiers : `.env.example` au dépôt (jamais de `.env` versionné) ; variables de build vérifiées **explicitement dans la CI** (message d'erreur nommant chaque variable manquante) ; séparation stricte config de déploiement (publique) / config utilisateur (saisie runtime, persistée, documentée comme risque).
- Base-path de déploiement injectée, jamais codée.
- Métadonnées de build (version, hash, date) générées au build dans un fichier non versionné.

## 5. Conventions initiales

Celles de `CONVENTIONS.md`, posées au premier commit : alias racine, PascalCase composants, `__tests__/` co-localisé, clés i18n partout, `BaseError` obligatoire, `FunctionResult` aux frontières de commande, liste blanche de lint = verdicts documentés.

## 6. Tests

- Harnais global de stubs d'API d'environnement documenté (leçon : un stub manquant = symptômes diffus).
- Faux moteur de persistance + réinitialisation entre tests dès le premier repository.
- Une pyramide dès le départ : les premières tests du projet = les lois du domaine ; un E2E de fumée dès la première route.
- Interdiction de mocker le propre code d'accès aux données ; assertions E2E par rôles accessibles, sans testid ; retries CI only.

## 7. CI/CD initiale

Le squelette de `CI-CD.md` : job validate (types → tests → format → lint-ratchet baseline 0 → audit), job e2e PR-only, job publish conditionné, `permissions {}` par défaut, actions épinglées par SHA, concurrency cancel, cache sur lockfile. **Baseline du ratchet : 0** sur un projet neuf (le ratchet sert à hériter d'une dette, pas à en créer).

## 8. Documentation initiale

`README` (à quoi ça sert, liens, commandes), `docs/architecture.md` daté de sa vérification, `docs/DECISIONS.md` amorcé avec les ADR D-A..D-J rejoués pour la cible, `docs/securite.md` avec la frontière de confiance et les risques acceptés + déclencheurs, `CONTEXT.md` du (nouveau) domaine, guide développeur avec carte de navigation et pièges.

## 9. Observabilité initiale

Module de logging unique + niveaux + anti-console ; erreurs à contexte sérialisées au boundary ; journal d'événements système en base locale ; métadonnées de build exposées.

## 10. Sécurité initiale

CSP + en-têtes (si servi web) ; sanitisation du rendu de contenu externe ; validation par schéma de tout import ; hook anti-secrets ; politique de dépendances (SHA épinglé pour tout requirement git) ; registre `securite.md` avec points fermés « pour mémoire ».
