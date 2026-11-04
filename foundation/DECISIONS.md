# DECISIONS

Les ADR du source (`docs/DECISIONS.md`) méritent d'être rejoués pour un nouveau projet. Format demandé : Decision / Context / Problem / Options / Chosen approach / Rationale / Consequences / Technology dependency / Transferability.

## D-A — Local-First : la persistance locale est la source de vérité (source : D-001)

- **Contexte** : app de travail utilisée dans un navigateur, sans backend applicatif ; la donnée doit survivre au offline et rester la propriété de l'utilisateur.
- **Problem** : où vit la donnée métier sans créer de cache désynchronisable ?
- **Options** : store global + sync distante (classique) / cache serveur + base locale / base locale réactive seule.
- **Chosen approach** : base locale réactive unique ; store global réduit au statut d'exécution et aux notifications ; services distants optionnels et pontés.
- **Rationale** : supprime tout code de resynchronisation ; rend l'app utilisable sans réseau.
- **Consequences** : toute nouvelle donnée métier va dans la base + un abonnement ; le store global reste « volontairement vide ».
- **Technology dependency** : IndexedDB/Dexie = implémentation ; le choix du moteur est un point à trancher pour la cible.
- **Transferability** : **UNIVERSAL** (principe) / ECOSYSTEM (moteur).

## D-B — Result Pattern + discipline d'erreurs complète (source : D-002)

- **Contexte** : ~60 sites de `throw` audités ; erreurs métier noyées dans des `try/catch`.
- **Problem** : traiter les échecs attendus sans perdre le typage ni noyer le contexte.
- **Options** : exceptions typées seules / Result seul / hybride ruled.
- **Chosen approach** : hybride réglé par 7 règles (Result aux frontières ; absence = valeur ; exceptions = irrécupérable capturé une fois au boundary ; `cause` préservée ; erreurs nomment le job ; helpers throwing = erreurs typées ; **garde-fou lint** à liste blanche = verdicts documentés).
- **Rationale** : la règle seule ne tient pas sans verrou mécanique ; la liste blanche transforme chaque exception en décision traçable.
- **Consequences** : `new Error` nu est une faute de lint ; `patch()` des aggregates exclut les champs gardés.
- **Technology dependency** : le type union discriminé (ou équivalent) ; le sélecteur AST du lint est écosystémique, le principe est transposable dans tout lint à règles personnalisées.
- **Transferability** : **UNIVERSAL**.

## D-C — Pas de conteneur IoC ; factories de module + escalade documentée (source : D-003)

- **Problem** : point d'injection stable pour les repositories (testabilité).
- **Options** : conteneur Awilix / factory de module + imports directs / contexte UI + injection dans l'orchestrateur.
- **Chosen** : factories de module ; **l'escalade est écrite** (contexte UI, `context` de saga) avant toute dépendance externe.
- **Rationale** : coût/bénéfice disproportionné en projet solo ; friction avec la réactivité et l'orchestrateur.
- **Consequences** : la testabilité vient du vrai stack sous test (D-004), pas de la mockabilité.
- **Transferability** : **ECOSYSTEM** (la réponse dépend des idiomes d'injection de la cible) ; le réflexe « consigner l'escalade plutôt que fermer la porte » est UNIVERSAL.

## D-D — Proportionnalité : corriger le symptôme, refuser l'abstraction speculative (source : D-004 + D-005)

- **Problem** : contrats non tenus, duplications, accesseurs contournables.
- **Options** : refonte structurelle (interface Table/Provider/Descriptor, design-it-twice, 3 options) / correctifs directs proportionnés.
- **Chosen** : correctifs directs + tests sur le vrai stack + « small-repo collapse » (profiter d'un commit réel pour réduire la couche, jamais de big-bang). L'interface étudiée a été **abandonnée puis consignée comme abandon définitif**.
- **Rationale** : ~80 % de la valeur d'une refonte pour 20 % du coût ; la complexité ajoutée dépassait le problème pour un projet de cette taille.
- **Consequences** : une abstraction refusée reste documentée avec son motif d'abandon — un nouveau projet doit **commencer avec cette retenue**, pas la découvrir.
- **Transferability** : **UNIVERSAL** (méthode), la forme du correctif est PROJECT_SPECIFIC.

## D-E — Loi de statut : un seul foyer, module pur, alphabets clos (source : D-008)

- **Problem** : loi de transition implémentée 4 fois, divergences réelles (mappings d'icônes distincts, sweeper fabriquant des faux succès).
- **Options** : garder la duplication / centraliser dans un service / centraliser dans un module pur.
- **Chosen** : module pur sans import technique ; événements pilotent les transitions ; statut dérivé de la file ; tables de présentation totales côté UI ; valeurs persistées inconnues = erreur typée migrée.
- **Rationale** : seul un module sans dépendance est testable sans harness et réutilisable par la persistance, l'orchestrateur et l'UI.
- **Consequences** : condition préalable du moteur de file headless (D-F) ; les plugins émettent des événements, jamais des statuts.
- **Transferability** : **UNIVERSAL**.

## D-F — Redux-Saga en retraite par l'aval, vers un moteur de file à ports (source : D-006)

- **Problem** : la saga monolithique contient loi+file+reprise+mapping : la retirer d'un coup = réécriture non testable.
- **Chosen** : ordre imposé — d'abord la loi pure (fait), puis `queueEngine.run(worker, plugin, ports)`, puis adaptation de la saga/bridge en coquilles vides ; corrections intégrées au passage (annulation de l'attente au stop).
- **Leçon transférable** : pour sortir d'un monolithe d'orchestration, **extraire les lois avant de changer le mécanisme** ; jamais l'inverse.
- **Transferability** : la méthode est **UNIVERSAL** ; Redux-Saga lui-même est FRAMEWORK et ne doit pas être reproduit.

## D-G — Plugins par auto-découverte + drapeau expérimental (source : D-007)

- **Chosen** : un fichier = un plugin, découvert au build ; flag runtime pour l'expérimental ; erreurs typées nommant le job.
- **Consequences (négatives assumées)** : le glob ne descend pas dans les sous-dossiers → zone morte archivée ; deux registries ont divergé (dette Q6) → l'unicité du registry est le vrai invariant, la découverte n'en est qu'un moyen.
- **Transferability** : **FRAMEWORK** ; remplacer par le mécanisme de la cible ou un registry explicite unique.

## D-H — Feature-first opportuniste, sans barrels (source : D-009)

- **Chosen** : frontières `ui/common/layout/features/<domaine>`, migration par tranches cohérentes liées à un changement fonctionnel ; pas de barrel/wrapper pour masquer les frontières ; pas de règle de lint dédiée tant que les frontières ne sont pas éprouvées.
- **Rationale** : éviter le grand déplacement sans valeur ; laisser les frontières se prouver par l'usage.
- **Transferability** : **UNIVERSAL** (méthode de restructuration).

## D-I — Politique de tests pyramide + harnais explicite (source : D-010)

- Voir TESTING.md ; l'ADR ajoute la dimension « le harnais est un actif documenté » (stubs requis et leur raison, mock i18n = contrat complet, règle des 10 runs E2E).
- **Transferability** : **UNIVERSAL**.

## D-J — Mono-utilisateur assumé, risque accepté avec déclencheur (source : D-011)

- **Chosen** : pas de garde de routes ; clés API en stockage local ; **condition de réexamen écrite** dans l'ADR et le registre de sécurité.
- **Transferability** : **PROJECT_SPECIFIC** (la décision ne se transpose pas ; **le format « risque accepté + déclencheur de réouverture » se transpose toujours**).
