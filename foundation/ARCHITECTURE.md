# ARCHITECTURE

## 1. Architecture réelle observée (OBSERVED)

CorpuSense n'est **pas** une architecture en couches classique « UI → Use Cases → Domain → Infrastructure ». C'est une architecture **local-first à deux flux** :

```text
FLUX DE LECTURE (réactif, dominant)
  Composant → hook de données → repository (via factory module) → moteur de persistance
      ↑ re-rendu automatique à toute écriture (abonnement aux tables)

FLUX D'ÉCRITURE (commandé, orchestré)
  Composant → action de commande → orchestrateur asynchrone (saga) → plugin → services externes
                                                            ↘ résultat persisté via repository
                                                                  ↻ le flux de lecture fait le reste
```

Points structurants :

1. **La persistance est la source de vérité**, pas un cache. L'UI s'y abonne ; aucun store applicatif ne duplique la donnée métier.
2. **Redux (ou tout store global) est volontairement vidé de la donnée métier** : il ne porte que le statut d'exécution des traitements et les notifications.
3. **Les traitements lourds sont des plugins autonomes**, découverts dynamiquement, qui émettent des _événements_ et jamais des statuts bruts.
4. **La loi des statuts est un module pur**, sans import framework, seul endroit où les transitions sont décidées.
5. L'asynchrone distribué (jobs externes) est une **passerelle** : la file locale reste la référence, le service distant est mappé vers les statuts locaux, avec repli périodique si le canal temps réel tombe.

Représentation conceptuelle fidèle :

```text
        ┌───────────── Interface (pages, composants) ─────────────┐
        │  abonnement réactif ↑              commandes ↓           │
   Hooks de lecture      dispatch commandes          tables de présentation
        │                        │                            ↑
        ↓                        ↓                            │
   Repositories            Orchestrateur                 Loi d'état (pure)
        │                        │                       (aucune dépendance)
        ↓                        ↓
   Moteur de persistance     Plugins ──── Services externes
        (local-first)                 (OCR, LLM, jobs distants)
```

## 2. Règle de dépendances (OBSERVED + INFERRED)

Compréhensible indépendamment du langage :

```text
Interface → (hooks/abonnements | commandes) → Repositories → Persistance
Interface → Orchestrateur → Plugins → Services externes
Loi d'état  ←  tout le monde peut l'importer ; elle n'importe rien
INTERDIT : Interface → Persistance directe
INTERDIT : Persistance/Modèles → Interface (imports inverses ; 2 violations connues, roadmap R3.6/Q4)
```

- Toute accès données passe par une **factory de module** retournant des repositories ; pas de conteneur d'injection (D-003, décision assumée pour un projet solo).
- Les modules de domaine pur (loi de statut, convertisseurs) ne doivent importer ni framework UI, ni ORM, ni SDK de service.

**Transposition** : dans n'importe quel langage, cette règle s'exprime comme « l'interface et l'infrastructure sont deux extrémités qui pointent vers un cœur de règles pures ; le cœur ne connaît ni l'une ni l'autre ». Elle se vérifie par outil d'analyse de dépendances propre à chaque écosystème (imports checkers, plugins de lint à frontières, etc.).

## 3. Découpage physique (OBSERVED)

- `pages/` (écrans routés) · `components/{ui,common,layout,features/<domaine>}` (feature-first, migration opportuniste D-009, sans barrels) · `hooks/` (abonnements + UI) · `state/` (orchestrateur, loi, stores minimes) · `data/{models,repositories}` · `utils/`.
- Règle d'atterrissage : tout nouveau composant métier va directement dans sa feature ; les primitives génériques dans `ui/` ; pas de composant « commun » prématuré.

## 4. État et données — qui possède quoi (OBSERVED, D-001)

| Type d'état                        | Propriétaire                      | Justification                                                            |
| ---------------------------------- | --------------------------------- | ------------------------------------------------------------------------ |
| Métier persistant                  | Base locale réactive              | survit au offline, source de vérité unique                               |
| Statut d'exécution des traitements | store global minimal              | transitoire, multi-vues, ne se persiste pas tel quel (dérivé de la file) |
| Notifications/toasts               | store global minimal              | éphémère                                                                 |
| Session/sélection/contexte de page | contexte UI local                 | lié au cycle de vie d'un écran                                           |
| Handle d'API système (filesystem)  | store minimal dédié               | objet non sérialisable, global                                           |
| Config utilisateur & clés          | stockage persistant du navigateur | choix explicite, risque documenté                                        |
| Données externes ponctuelles       | couche de fetch avec cache        | pas métier, invalidable                                                  |

Principe transférable : **chaque mécanisme a un rôle exclusif écrit quelque part** ; la dérive vient toujours d'un état qui n'a pas de propriétaire nommé. Le projet source recommande explicitement de ne pas généraliser : cinq mécanismes coexistent parce que chacun a une raison nommée dans un ADR, pas par accumulation.

## 5. Traitements asynchrones (OBSERVED)

- File de tâches par worker, portée par un **scope** (projet/collection/canvas) identifié par clé dérivée.
- Statuts = alphabets clos (`TaskStatus` ≠ `WorkerStatus`), transitions validées par la loi, statut du worker **dérivé** de la file, jamais stocké en dur sans derivation.
- Reprise après arrêt inopiné au démarrage ; interruption = rejeu des tâches `WAITING` ; timeout sur les statuts d'attente externe → `COMPLETED_WITH_ERRORS` (ne jamais fabriquer de succès).
- Jobs distants : écriture dans une file externe, statuts intermédiaires `POSTING/POSTED`, retour temps réel **avec repli en sondage périodique** (20 s).
- Cible explicite du projet (D-006) : **moteur de file headless** `run(worker, plugin, ports)` où ports = repository + horloge + notifieur, l'orchestrateur actuel et la passerelle temps réel n'étant que des adaptateurs fins. C'est la forme à retenir pour un nouveau projet.

## 6. Configuration (OBSERVED)

- Deux classes : **build-time** (variables publiques injectées au build : base path, URLs de services, version/hash/date) et **runtime utilisateur** (clés API saisies dans l'app, persistées côté client, jamais dans le dépôt).
- Le CI **échoue explicitement** si une variable de build requise manque.
- Transposable : séparer systématiquement configuration de déploiement (publique, vérifiée) et configuration utilisateur (saisie, persistée, documentée comme risque).

## 7. Gestion des erreurs — philosophie (OBSERVED, D-002)

1. Échec attendu et traitable à l'appel → **Result typé** à la frontière.
2. **Absence = valeur** (`undefined`, `[]`), jamais une erreur — notamment pour les abonnements réactifs.
3. Incident irrécupérable → exception, capturée **une seule fois** au boundary (superviseur d'orchestrateur, UI, passerelle temps réel).
4. Un boundary **relaie ou enrobe avec `cause`**, ne remplace jamais.
5. Erreur de plugin = nomme le job fautif (plugin, tâche, URL) dans message et contexte.
6. Garde-fou **mécanique** : la création d'exceptions nues est interdite par lint, avec liste blanche au fichier où chaque ligne est un verdict documenté.

## 8. Architecture cible abstraite pour un nouveau projet (RECOMMENDED)

Sans cible technologique fixée, la forme à reprendre telle quelle :

```text
Interface            (UI, CLI, API… — ne touche jamais la persistance directement)
    ↓ commandes          ↑ abonnements/flux
Application          (moteur de file headless avec ports ; orchestration des plugins)
    ↓
Domaine              (entités, DTO, validation, LOIS PURES : statuts, invariants)
    ↑
Infrastructure       (adapteurs : persistance, services externes, plugins, notifications)
```

- **Interface** : dépend des hooks de lecture et du dispatch de commandes ; ignore le moteur de stockage.
- **Application** : moteur de file + registre de plugins ; dépend du domaine, reçoit ses ports en injection (repository, horloge, notifieur).
- **Domaine** : zéro import technique ; contient les lois d'état et la validation des schémas.
- **Infrastructure** : implémente les ports ; un adaptateur de test (fausse persistance ou persistance in-process) doit exister dès le premier jour.
- Frontière non négociable héritée du source : **la loi d'état et la dérivation des statuts n'existent qu'à un seul endroit**.

Choix technologiques à trancher avant démarrage : moteur de persistance (local-first navigateur vs base embarquée vs serveur), framework d'interface, mécanisme d'orchestration asynchrone, format des plugins (voir `STARTER.md`).
