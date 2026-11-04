# FOUNDATION — CorpuSense

Extraction des fondations réutilisables du projet **CorpuSense** en vue de démarrer un nouveau projet, potentiellement dans une autre technologie. **Aucune stack cible n'a été fixée** : ce document reste au niveau conceptuel et signale les points nécessitant un choix technologique.

> Ce n'est pas une documentation de CorpuSense. La documentation de référence du projet source reste `docs/architecture.md`, `docs/DECISIONS.md`, `docs/developpement.md`. Ce répertoire répond à une seule question : _quoi, dans ce projet, mérite d'être conservé comme fondation d'un nouveau projet ?_ Les constats sur le projet source sont un instantané historique, pas un suivi vivant : consulter la roadmap et le registre de sécurité de `docs/` avant de les reprendre.

## Le projet source en une phrase

Application web **Local-First** d'ingénierie documentaire (React 19 / TypeScript / Vite / IndexedDB-Dexie) : collection de documents IIIF, annotation vectorielle W3C, traitements asynchrones (OCR/LLM) orchestrés par plugins, export de données structurées.

## Grille de lecture

Chaque document de ce dossier distingue systématiquement :

- **OBSERVED** — présent explicitement dans le projet source ;
- **INFERRED** — déduit de plusieurs éléments du projet ;
- **RECOMMENDED** — recommandation pour un nouveau projet, pas nécessairement présente dans le source.

Et classe la réutilisabilité : `UNIVERSAL` · `ECOSYSTEM` · `FRAMEWORK` · `DOMAIN` · `PROJECT_SPECIFIC`.

## Cartographie des six catégories

### 1. Indépendant de la technologie (UNIVERSAL)

- Séparation stricte **lecture réactive / écriture par commande** (CQRS-like implicite).
- **Result Pattern typé** aux frontières de commande + hiérarchie d'erreurs avec contexte JSON structuré (D-002).
- **Loi d'état dans un module pur** sans dépendance framework (D-008) — testable isolément.
- Chaque mécanisme d'état a un **rôle exclusif** documenté ; l'absence d'une donnée est une valeur, pas une erreur.
- Pyramide de tests + tests sur le **vrai stack de persistance** (pas de mock de la base) (D-004, D-010).
- **Ratchet qualité** : baseline consignée qui ne peut que baisser.
- Pipeline CI où le déploiement est **conditionné** par la validation ; permissions minimales ; actions épinglées par SHA.
- Documentation en quatre foyers : spécification vivante vérifiée contre le code, ADR datés avec statut, registre de sécurité vivant, roadmap avec critères de sortie.
- Glossaire du domaine à la racine (`CONTEXT.md`) avec termes à éviter (`_Avoid_`).

### 2. Dépendant de l'écosystème (ECOSYSTEM)

- Persistance dans le navigateur via IndexedDB (Local-First) — le _principe_ est universel, l'_implémentation_ est web.
- Configuration par variables `VITE_*` lues via `import.meta.env` ; build statique déployable sous sous-répertoire.
- i18n par clés avec mock de test renvoyant les clés à l'identique.
- Alias d'import `@/`, tests co-localisés `__tests__/`, PascalCase composants.

### 3. Dépendant du framework (FRAMEWORK)

- `useLiveQuery` (dexie-react-hooks), hooks React de données, Context providers, Redux-Saga, plugin discovery par `import.meta.glob`, shadcn/Radix. Ces mécanismes **ne se transfèrent pas tels quels** ; leurs principes oui (voir `PATTERNS.md`).

### 4. Domaine métier (DOMAIN — ne pas transposer sans raison)

- Vocabulaire : Worker, Task, Job, Plugin, Result, Scope, Collection, Canvas, Source, Modifier Chain.
- IIIF/W3C Annotation, Supabase `cs_jobs`, formats d'export. Utiles seulement si le nouveau projet traite le même domaine.

### 5. Dette technique (à ne pas reproduire)

Voir `TECHNICAL-DEBT.md` : saga-monolithe ~420 lignes, duplication des plugins LLM, double registry de plugins, trois niveaux « utils », `xlsx` vulnérable, ~59 `console.log`, etc.

### 6. Manquant (à ajouter au nouveau projet)

Voir `TECHNICAL-DEBT.md` § Éléments manquants : guards d'architecture par lint, protection de branches, CSP, logging structuré, seuil de couverture, etc.

## Index des documents

| Document                                           | Contenu                                                                 |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md)               | Architecture réelle, règle de dépendances, architecture cible abstraite |
| [CONVENTIONS.md](./CONVENTIONS.md)                 | Conventions de code, nommage, documentation, Git                        |
| [PATTERNS.md](./PATTERNS.md)                       | Patterns réels avec leur version abstraite                              |
| [DATA.md](./DATA.md)                               | Modèle de données, validation, migrations, persistance                  |
| [TESTING.md](./TESTING.md)                         | Stratégie de tests observée + stratégie générique                       |
| [CI-CD.md](./CI-CD.md)                             | Pipeline observée + pipeline de référence                               |
| [OBSERVABILITY.md](./OBSERVABILITY.md)             | Logging, métriques, Build-info — principe / implémentation / techno     |
| [SECURITY.md](./SECURITY.md)                       | Registre de sécurité transposable                                       |
| [DECISIONS.md](./DECISIONS.md)                     | ADR source avec transferability                                         |
| [TECHNICAL-DEBT.md](./TECHNICAL-DEBT.md)           | Dette + éléments manquants                                              |
| [STARTER.md](./STARTER.md)                         | Spécification du starter (conceptuelle)                                 |
| [BOOTSTRAP-CHECKLIST.md](./BOOTSTRAP-CHECKLIST.md) | Checklist ordonnée de bootstrap                                         |

## Matrice de transférabilité

| Élément                                         | Source                       | Niveau                                       | Réutilisable                              | Adaptation                          | Cible                                    |
| ----------------------------------------------- | ---------------------------- | -------------------------------------------- | ----------------------------------------- | ----------------------------------- | ---------------------------------------- |
| Séparation lecture réactive / écriture commande | Flux 1 & 2, D-001            | UNIVERSAL                                    | Oui                                       | Faible                              | Tout projet avec état persistant         |
| Result Pattern + BaseError + garde-fou lint     | `functionResult.ts`, D-002   | UNIVERSAL (traduction typée par langage)     | Oui                                       | Moyenne                             | Toute frontière de commande              |
| Loi d'état en module pur                        | `workerStatusLaw.ts`, D-008  | UNIVERSAL                                    | Oui                                       | Faible                              | Tout système à cycles de vie             |
| Rôles exclusifs des mécanismes d'état           | D-001, `states.md`           | UNIVERSAL                                    | Oui                                       | Faible                              | Toute app à état multiple                |
| Docs : spec + ADR + registre sécurité + roadmap | `docs/`                      | UNIVERSAL                                    | Oui                                       | Faible                              | Tout projet                              |
| Glossaire domaine (`CONTEXT.md`)                | racine                       | UNIVERSAL                                    | Oui                                       | Faible                              | Tout projet                              |
| Ratchet ESLint + baseline                       | `scripts/eslint-ratchet.mjs` | ECOSYSTEM (le principe est UNIVERSAL)        | Oui                                       | Moyenne                             | Tout CLI de lint machine-readable        |
| Pyramide de tests + faux moteur de persistance  | D-004, D-010                 | UNIVERSAL                                    | Oui                                       | Moyenne                             | Tout projet avec stockage                |
| E2E sans réseau externe (fixtures interceptées) | `e2e/`                       | ECOSYSTEM                                    | Oui                                       | Moyenne                             | Tout E2E avec service web                |
| CI réutilisable + deploy conditionné            | `ci.yml`/`deploy.yml`        | ECOSYSTEM (GitHub Actions)                   | Oui                                       | Moyenne                             | Tout système de CI                       |
| Plugins découverts dynamiquement                | D-007                        | FRAMEWORK (Vite glob)                        | Le principe : Oui                         | Forte                               | Registry explicite ailleurs              |
| `useLiveQuery` / sagas / Context                | D-001, D-006                 | FRAMEWORK                                    | Non (tels quels)                          | Forte                               | Voir version abstraite dans PATTERNS.md  |
| IndexedDB/Dexie v32, schéma stores              | `db.ts`                      | ECOSYSTEM+DOMAIN                             | Non                                       | Forte                               | Moteur local-first équivalent ou serveur |
| Vocabulaire Worker/Task/Job/Scope…              | `CONTEXT.md`                 | DOMAIN                                       | Si même domaine                           | —                                   | —                                        |
| IIIF / W3C / Supabase cs_jobs                   | plugins, hooks               | DOMAIN                                       | Si même domaine                           | —                                   | —                                        |
| Saga `workers.ts` (~420 l.)                     | code                         | PROJECT_SPECIFIC                             | Non — à remplacer par queueEngine (D-006) | —                                   | —                                        |
| Clés API en localStorage                        | D-011, S-04                  | PROJECT_SPECIFIC (contexte mono-utilisateur) | Partiel                                   | À reconsidérer si multi-utilisateur | —                                        |

## Synthèse finale

### À conserver (bonnes fondations)

1. **Architecture en couches avec deux flux distincts** : lecture réactive via repositories, écriture par commandes orchestrées ; UI jamais en contact direct avec la persistance.
2. **Discipline d'erreurs complète** (D-002) : Result typé, erreurs avec contexte, exceptions uniquement pour l'irrécupérable capturées une seule fois au boundary, interdiction mécanique du `new Error` hors liste blanche documentée.
3. **Loi d'état centralisée dans un module pur** avec alphabets clos, mappings totaux, refus = erreur typée (D-008).
4. **Un rôle exclusif par mécanisme d'état**, acté par ADR et vérifié par un doc dédié (`states.md`).
5. **Politique de documentation** : spec datée « vérifiée contre le code », ADR avec statut et déclencheurs de réouverture, registre de sécurité avec critiques et actions, roadmap avec critères de sortie — et la règle « rien d'obsolète dans docs/ ».
6. **Pyramide de tests** avec tests sur le vrai stack de persistance, harnais documenté (stubs requis et pourquoi), E2E déterministes sans réseau externe.
7. **Ratchet qualité** : la dette héritée est consignée et ne peut qu'augmenter la barre jamais le contraire.
8. **CI minimaliste mais rigoureuse** : permissions vides par défaut, actions épinglées par SHA, concurrency avec cancel, validation réutilisable avant deploy, variables manquantes = échec explicite.
9. **Proportionnalité** (D-004/D-005) : corriger les symptômes sans ajouter d'abstraction speculative ; oser abandonner une abstraction étudiée et consignée.
10. **Glossaire du domaine versionné** avec termes interdits.

### À adapter (utiles mais dépendants du contexte)

1. Local-First IndexedDB → transposer le principe « la donnée de travail appartient à l'utilisateur, offline d'abord » vers le moteur/localité que choisira la cible.
2. Découverte de plugins par glob → remplacer par un registry explicite ou du plugin-loading natif de la cible.
3. Redux-Saga → ne pas le reproduire ; viser directement l'objectif D-006 : un moteur de file headless avec ports injectés.
4. Variables `VITE_*` + sous-répertoire → adapté au web statique ; garder le principe « configuration build-time explicitement vérifiée au CI ».
5. Kés API en localStorage → valable uniquement si la frontière de confiance reste la machine de l'utilisateur (D-011).

### À abandonner

1. La saga `workers.ts` monolithique (loi + file + reprise + mapping mêlés).
2. La duplication des plugins LLM (Mistral/OpenAI, ~200 lignes) et la triplication des exports.
3. Le double registry de plugins (`App.tsx` vs `sagas/workers.ts`).
4. Les trois niveaux « utils » (`lib/`, `utils/`, `data/utils/`) et les alias dépréciés.
5. `xlsx` non maintenu et dépendances non épinglées (`cozy-iiif` sur GitHub sans tag). `stats.html` est désormais ignoré.
6. `console.log` en production ; le debug inconditionnel de l'ORM a depuis été supprimé.
7. `.env` versionné historiquement (secrets publics par design, mais le réflexe est à corriger).

### À ajouter (absents du source, recommandés au nouveau projet)

1. **OBLIGATOIRE** : règles de lint d'architecture (frontières de couches) dès le départ ; protection de branches rendant le CI bloquant ; validation des entrées d'import (schéma) ; logging structuré via un module unique.
2. **RECOMMANDÉ** : CSP + en-têtes de sécurité ; sanitisation systématique du contenu rendu (markdown/HTML) ; seuil de couverture sur le cœur métier ; health/version endpoint ; artefact de version injecté proprement au build.
3. **OPTIONNEL** : métriques d'usage anonymes, feature-flag system au-delà du drapeau `experimental`, snapshots E2E.
