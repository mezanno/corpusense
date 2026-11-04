# CONVENTIONS

Tout ce qui est marqué OBSERVED est réellement pratiqué dans le dépôt source (vérifié via docs + code) ; INFERRED et RECOMMENDED sont à distinguer des pratiques du source.

## Structure et nommage (OBSERVED)

- Alias racine obligatoire pour les imports internes (`@/…`) — jamais de chemins relatifs profonds.
- Composants en PascalCase ; kebab-case toléré uniquement dans le dossier des primitives régénérées par un générateur externe (shadcn).
- Tests unitaires/composants **co-localisés** dans `__tests__/` à côté de la source ; tests E2E **jamais** co-localisés (répertoire `e2e/` dédié, la co-localisation est réservée au runner unitaire).
- Découpage des composants par responsabilité : primitives sans logique métier / transversaux / shell+navigation / `features/<domaine>/` avec styles et tests co-localisés.
- Feature-first appliqué **opportunément** : on déplace un composant quand un changement fonctionnel le justifie, jamais par migration mécanique (D-009).
- Un mot = un sens, imposé par le glossaire (`CONTEXT.md`) avec section `_Avoid_` par terme : « Plugin » pas « provider/connector », « Task » pas « job », « Seam » pas « boundary ». Les termes interdits sont aussi précis que les termes retenus.

## Conventions de code (OBSERVED)

- Toute entité persistée complexe a un **schéma de validation** (Zod `.strict()` là où c'est établi) ; le type en découle (`z.infer`).
- Frontières de commande : retour `FunctionResult` typé ; pas de `try/catch` dispersés ; jamais `new Error` hors hiérarchie `BaseError` (interdit par lint, liste blanche au fichier commentée d'un verdict).
- Erreur courante nommée : `NotFoundError` (l'alias déprécié a un chemin de migration, pas de coexistence prolongée).
- Les chaînes UI passent par des **clés i18n** ; les tests assertent sur les clés (le mock de test les renvoie à l'identique) — la traduction n'est jamais un sujet de test.
- Aucune URL absolue codée en dur : base path de déploiement injectée par la configuration.
- Les helpers volontairement levants doivent lever une erreur typée avec contexte, jamais une erreur nue.

## Conventions de commits & Git (OBSERVED / INFERRED)

- INFERRED : commits petits, « un commit par port/famille » ; le reformatage n'est pas mélangé aux déplacements structurels (explicité dans la roadmap R7).
- OBSERVED : branche `develop` intégrée par PR, `main` = stable, branche `gh-pages` pour le site publié ; fourche de développement séparée pour garder un canal stable + un canal de test publics.
- OBSERVED : une PR décrit le besoin et le changement, captures d'écran pour l'UI, lint/tests verts exigés.
- RECOMMENDED : compléter par des conventions de message de commit conventionnalisées (le source ne les formalise pas) et protection de branches rendant le CI bloquant (roadmap Q3, encore à faire dans le source).

## Politique de documentation (OBSERVED — l'une des meilleures pratiques du projet)

| Foyer | Public | Règle |
|---|---|---|
| `docs/` | contributeurs | spec de référence **datée d'une vérification contre le code** ; rien d'obsolète — une note consolidée se supprime, ses décisions survivent dans l'ADR |
| `docs/DECISIONS.md` | contributeurs | une entrée = une décision, avec contexte, statut, conséquences, déclencheurs de réouverture |
| `docs/roadmap.md` | contributeurs | chantiers avec **critères de sortie** vérifiables ; « comment reprendre un chantier » en tête de chapitre |
| `public/doc/` | utilisateurs | manuel utilisateur servi par l'app ; **rien de technique/interne** |
| `CONTEXT.md` racine | contributeurs | glossaire unique du domaine + vocabulaire d'architecture |
| `src/state/states.md` | contributeurs | l'état réel : « ce qui vit dans le store doit matcher le code ; sinon on corrige le doc » |

Autres pratiques documentées observées :

- Guide développeur avec « carte de navigation » (*où chercher quand…*) et section **pièges connus** — chaque piège est une décision implicite rendue explicite.
- Guides d'extension pas-à-pas (« ajouter une route », « ajouter un worker », « ajouter un modèle métier ») qui encodent l'architecture en procédure.
- Règle de proportionnalité érigée en convention : pas de nouvelle abstraction sans besoin au call site (D-004).
