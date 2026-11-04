# PATTERNS

Patterns réellement présents dans le projet source. Pour chacun : la version abstraite prime — l'implémentation source n'est qu'un exemple.

---

## P1 — Result Pattern typé aux frontières

- **Catégorie** : gestion des erreurs · **Réutilisabilité** : UNIVERSAL (expressible dans tout langage typé)
- **Problème** : les erreurs attendues (entité absente, refus de transition, erreur de stockage) disparaissent dans des `try/catch` dispersés ou des retours non typés.
- **Principe** : une fonction faillible dont l'échec est _normal_ retourne `{ ok: true, value } | { ok: false, error }` ; les erreurs sont une hiérarchie nommée portant un contexte JSON sérialisable et une `cause` préservée.
- **Implémentation actuelle** : `FunctionResult<T,E>` + `BaseError` (D-002), assortie d'un **garde-fou lint** (`no-restricted-syntax` sur la création d'erreurs nues, liste blanche au fichier, chaque ligne = un verdict documenté).
- **Version abstraite** : aux frontières de commande uniquement, retourner un somme discriminé succès/échec ; l'échec porte un type nommé + contexte. Les langages sans union discriminée l'expriment par exceptions typées + conventions de capture au boundary.
- **Quand l'utiliser** : toute frontière traversable par plusieurs appelants. **Quand ne pas l'utiliser** : les abonnements réactifs (un Result à deux états ne peut pas exprimer `loading|missing|found` — l'absence y est une valeur).

## P2 — Deux flux : lecture réactive / écriture commandée

- **Catégorie** : architecture · **Réutilisabilité** : UNIVERSAL
- **Problème** : dupliquer la donnée métier dans un store applicatif crée la désynchronisation.
- **Principe** : la lecture se fait par **abonnement** à la source de vérité (aucun état miroir) ; l'écriture se fait par **intention nommée** (commande) traitée par un orchestrateur ; l'UI ne connaît ni l'ORM ni la file.
- **Implémentation actuelle** : `useLiveQuery` via hooks de données + actions dispatchées vers une saga. **Version abstraite** : flux de changement côté lecture, bus de commandes ou appels de cas d'usage côté écriture ; l'essentiel est l'**asymétrie** (la lecture ne passe jamais par l'écriture et réciproquement).
- **Avantage** : suppression de tout code de resynchronisation. **Inconvénient** : suppose un moteur de persistance observable ou un bus d'événements.

## P3 — Loi d'état en module pur

- **Catégorie** : domain modeling · **Réutilisabilité** : UNIVERSAL
- **Problème** : la loi de transition des statuts était implémentée **quatre fois** et divergeait déjà (D-008).
- **Principe** : les statuts sont des **alphabets clos** ; la loi (transitions autorisées, prédicats, fonctions de dérivation) vit dans un module sans AUCUNE import technique (ni framework, ni ORM, ni SDK) ; refus = erreur typée ; les mappings vers l'UI sont des **tables totales** indexées par l'enum, sans branche `default` runtime — l'exhaustivité est garantie par le typage.
- **Version abstraite** : machine à états fonctionnelle (`transition(state, event) -> Result<state>`, `derive(queue) -> state`) testable sans harness d'environnement ; la persistance et l'UI ne font qu'appeler la loi.
- **Règle corollaire observée** : les plugins émettent des **événements**, jamais des statuts bruts ; le champ statut n'est modifiable que par la transaction qui applique la loi (`patch()` l'exclut par le typage).

## P4 — Rôles exclusifs des mécanismes d'état

- **Catégorie** : state management · **Réutilisabilité** : UNIVERSAL
- **Principe** : si plusieurs mécanismes d'état coexistent, chacun a un **rôle exclusif écrit dans un ADR** et un doc d'inventaire (« ce qui vit hors du store »). La règle d'or observée : _toute nouvelle donnée métier va dans la persistance + un hook d'abonnement, jamais dans le store global_.
- **Anti-pattern combattu** : l'accumulation par défaut (« on met ça dans Redux pour l'instant »).

## P5 — Plugins découverts, registry assumé

- **Catégorie** : extensibilité · **Réutilisabilité** : FRAMEWORK (le mécanisme) / UNIVERSAL (le principe)
- **Principe** : un traitement = un fichier autonome exposant un contrat (`run(task)` + export de ses résultats) ; l'ajout d'un traitement ne modifie aucun fichier de registry ; un drapeau runtime filtre les plugins expérimentaux ; les erreurs de plugin nomment le job fautif.
- **Implémentation actuelle** : glob de modules au build (`import.meta.glob`, eager) — D-007. **Version abstraite** : auto-découverte là où l'écosystème la permet ; sinon **registry explicite monotone** (un seul endroit qui liste les plugins — le source a en dette un double registry, ce qui prouve le besoin d'unicité).
- **Inconvénient observé** : la découverte par glob ne descend pas dans les sous-répertoires → code mort accumulé ; la découverte implicite complète l'auditabilité.

## P6 — Ports injectés pour l'asynchrone (cible D-006)

- **Catégorie** : architecture asynchrone · **Réutilisabilité** : UNIVERSAL
- **Principe** : moteur de file headless `run(worker, plugin, ports)` où ports = repository + horloge injectée + notifieur ; orchestrateur, passerelle temps réel et récupération au démarrage ne sont que des **adaptateurs fins**. Testable sans framework : horloge fausse = timeouts déterministes.
- **Contexte** : état de l'art visé du source (la saga actuelle est le contre-exemple : loi+file+reprise+mapping mêlés dans ~420 lignes non testables).

## P7 — Factory de module sans conteneur d'injection

- **Catégorie** : composition root · **Réutilisabilité** : ECOSYSTEM
- **Principe** : une factory de module-scope centralise la création des repositories ; refus explicite d'un conteneur IoC (D-003) pour un projet solo, avec **escalade documentée** (contexte UI + injection de dépendances dans l'orchestrateur avant toute librairie).
- **Leçon transférable** : la testabilité sans IoC passe par le **vrai stack sous test** (voir P8) plutôt que par des mocks de factories.

## P8 — Ratchet qualité

- **Catégorie** : outillage · **Réutilisabilité** : UNIVERSAL (le principe), ECOSYSTEM (l'outil)
- **Problème** : une base de code avec dette héritée ne peut pas adopter « zéro erreur lint » du jour au lendemain, et sans barrière la dette remonte.
- **Principe** : baseline consignée dans un fichier versionné ; le CI compare le compteur courant à la baseline et **échoue si ça dépasse** ; l'encourage la baisse par un warning quand le chiffre baisse. Chaque écart restant est traçable.
- **Implémentation actuelle** : script Node appelant le lint en JSON et comparant à `.eslint-ratchet.json`.

## P9 — Boundary de capture unique

- **Catégorie** : fiabilité · **Réutilisabilité** : UNIVERSAL
- **Principe** : les exceptions irrécupérables remontent jusqu'à un boundary désigné (superviseur de l'orchestrateur, boundary d'UI, passerelle réseau) et y sont capturées **une seule fois**, relaiées ou englobées avec `cause` — jamais remplacées par un message générique (le source a fait l'inverse par le passé, et le documente comme point fermé du registre de sécurité).

## P10 — Tables de présentation totales

- **Catégorie** : présentation · **Réutilisabilité** : ECOSYSTEM (typage statique requis)
- **Principe** : toute correspondance enum → UI (icône, libellé, classe) est une table indexée par l'enum complet, **sans branche par défaut** ; une valeur inconnue persistée est une **erreur typée au chargement**, pas un rendu silencieux. La migration de données rejette explicitement les valeurs hors alphabet.
