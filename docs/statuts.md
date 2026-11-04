# Loi de statut — workers & tâches

_Spécification de référence des statuts et de leurs transitions, consolidée le 2026-10-09 après une session d'interrogation exhaustive des règles métier. Ce document est la loi, implémentée dans `src/data/models/worker/workerStatusLaw.ts` au titre de R1. Les décisions structurelles associées vivent dans [DECISIONS.md](./DECISIONS.md) (D-006, D-008) ; le vocabulaire dans [CONTEXT.md](../CONTEXT.md)._

## Périmètre

- **Un worker = une stratégie.** La stratégie d'exécution (1 ou 2, définies plus bas) est une propriété du worker, héritée de son plugin ; elle ne change pas en cours de vie et ne se mixe pas dans une file.
- Un worker est **créé et lancé dans le même instant** : il n'existe pas de statut pré-lancement, pas de file de workers. Ses tâches naissent en `WAITING`, le worker naît en `INPROGRESS`.
- **Stratégie 1** : la tâche envoie une requête et attend le résultat de façon synchrone avant la tâche suivante. **Aucune ligne `cs_jobs`, aucun appel Supabase** — la stratégie 1 ne laisse aucune trace serveur.
- **Stratégie 2** : la tâche poste une requête (créant une ligne `cs_jobs` en `pending`) et passe immédiatement à la tâche suivante ; son achèvement est suivi côté Supabase.
- La file est **séquentielle** ; une erreur de tâche ne l'interrompt pas : on passe à la tâche suivante.

## Alphabets

Il y a trois alphabets distincts, volontairement séparés (la scission des enums en découle, cf. D-008/R1) :

| Alphabet             | Valeurs                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **WorkerStatus**     | `INPROGRESS` · `INPROGRESS_WITH_ERRORS` · `COMPLETED` · `COMPLETED_WITH_ERRORS` · `UNFINISHED` · `UNFINISHED_WITH_ERRORS` |
| **TaskStatus**       | `WAITING` · `POSTING` · `POSTED` · `INPROGRESS` · `COMPLETED` · `COMPLETED_WITH_ERRORS`                                   |
| **`cs_jobs.status`** | `pending` · `processing` · `completed` · `failed` · `paused`                                                              |

Hors loi : `ALL` reste un filtre d'interface, jamais un statut persisté. Les statuts `WAITING`, `POSTING`, `POSTED` n'existent qu'au niveau tâche ; `UNFINISHED*` n'existe qu'au niveau worker ; `ERROR` (valeur de l'enum actuel commune) est abandonné — sa sémantique est couverte par `COMPLETED_WITH_ERRORS` côté tâche et les composés `_WITH_ERRORS` côté worker.

## Invariants

1. **Le statut du worker est dérivé de ses tâches, jamais autonome.** En dehors des statuts d'interruption (règle 2) :
   - toutes les tâches `COMPLETED` → worker `COMPLETED` ;
   - toutes les tâches en statut terminal avec ≥1 `COMPLETED_WITH_ERRORS` → worker `COMPLETED_WITH_ERRORS` ;
   - sinon : `INPROGRESS_WITH_ERRORS` si au moins une tâche est en échec, `INPROGRESS` sinon.
     Le recalcul est immédiat, à tout instant où la vérité est découverte (événement realtime, livraison tardive, relaunch).
2. **`UNFINISHED` / `UNFINISHED_WITH_ERRORS` sont les seuls statuts non dérivés.** Ils sont posés par le boot (reprise d'un worker persisté `INPROGRESS*`) ou par l'interruption manuelle, et ne sont levés **que** par un relaunch. Un worker `UNFINISHED` dont tous les jobs finissent entre-temps reste `UNFINISHED` ; son relaunch ne fait que livrer et clore (voir le flow de relaunch, étape 5).
3. **Le statut d'une tâche reflète la dernière vérité connue**, jamais un pic mémorisé. Les transitions directes entre statuts non-terminaux sont légales chaque fois qu'elles sont justifiées par la vérité serveur — y compris en arrière (`INPROGRESS` → `POSTED` après reprise d'un job `paused`).
4. Un composé `_WITH_ERRORS` n'est jamais « effacé » en cours de route ; en revanche **chaque relaunch repart propre** : le worker repart en `INPROGRESS` simple, les erreurs sont re-comptées pendant la nouvelle exécution, sans héritage.
5. **Supabase est la source de vérité des jobs.** Aucun timeout client sur un job `processing` : si un job y reste, c'est un problème serveur. Le seul timeout client est celui de l'état `POSTING` (stratégie 2), fixé à **60 secondes** d'absence de réponse du post.
6. Chaque tâche est identifiable dans `cs_jobs` par le couple `worker_id` + `task_id`. C'est ce qui rend le lookup de relaunch possible et sans doublons.
7. **Aucun historique** : seuls les statuts courants sont persistés (IndexedDB, cf. D-001). Pas de journal de tentatives.
8. Le retry est **au niveau worker uniquement** (relaunch). Il n'existe pas de retry d'une tâche individuelle.

## Mapping `cs_jobs` → TaskStatus (stratégie 2)

| `cs_jobs.status` | TaskStatus              |
| ---------------- | ----------------------- |
| `pending`        | `POSTED`                |
| `processing`     | `INPROGRESS`            |
| `completed`      | `COMPLETED`             |
| `failed`         | `COMPLETED_WITH_ERRORS` |
| `paused`         | `POSTED`                |

`paused` n'est jamais vu pendant la gelure d'un worker `UNFINISHED` (écoutes coupées) : il apparaît au client soit au moment de l'interruption manuelle (le client vient de le poser), soit au lookup de relaunch — où il a déjà été flipé en `pending`, ce qui produit le même statut `POSTED`.

## Transitions

### Tâche — stratégie 1

| De           | Vers                    | Déclencheur              |
| ------------ | ----------------------- | ------------------------ |
| `WAITING`    | `INPROGRESS`            | la file atteint la tâche |
| `INPROGRESS` | `COMPLETED`             | résultat OK              |
| `INPROGRESS` | `COMPLETED_WITH_ERRORS` | résultat en erreur       |

Pas de timeout : une stratégie 1 sans réponse gèle la file. **Risque accepté**, délibéré.

### Tâche — stratégie 2

| De                      | Vers                                                            | Déclencheur                                           |
| ----------------------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| `WAITING`               | `POSTING`                                                       | la file atteint la tâche                              |
| `POSTING`               | `POSTED`                                                        | réponse OK (ligne `cs_jobs` créée en `pending`)       |
| `POSTING`               | `COMPLETED_WITH_ERRORS`                                         | réponse KO **ou timeout d'absence de réponse (60 s)** |
| `POSTED` / `INPROGRESS` | `POSTED` / `INPROGRESS` / `COMPLETED` / `COMPLETED_WITH_ERRORS` | mapping `cs_jobs` (direct, en avant comme en arrière) |

### Worker

| De                                      | Vers                                  | Déclencheur                                                                                                                          |
| --------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| —                                       | `INPROGRESS`                          | création + lancement (atomiques) ; ou relaunch (toujours propre)                                                                     |
| `INPROGRESS`                            | `INPROGRESS_WITH_ERRORS`              | première tâche en échec de l'exécution en cours                                                                                      |
| `INPROGRESS_WITH_ERRORS`                | `INPROGRESS`                          | — interdit en cours de route (invariant 4)                                                                                           |
| `INPROGRESS` · `INPROGRESS_WITH_ERRORS` | `COMPLETED` / `COMPLETED_WITH_ERRORS` | toutes les tâches terminales (dérivation immédiate — le worker en phase d'écoute seule en stratégie 2 reste `INPROGRESS*` jusque-là) |
| `INPROGRESS`                            | `UNFINISHED`                          | boot après crash/fermeture, ou interruption manuelle                                                                                 |
| `INPROGRESS_WITH_ERRORS`                | `UNFINISHED_WITH_ERRORS`              | mêmes déclencheurs                                                                                                                   |
| `UNFINISHED` · `UNFINISHED_WITH_ERRORS` | `INPROGRESS`                          | relaunch                                                                                                                             |
| `UNFINISHED` · `UNFINISHED_WITH_ERRORS` | `COMPLETED` / `COMPLETED_WITH_ERRORS` | relaunch ne trouvant aucun travail restant                                                                                           |
| `UNFINISHED*`                           | `UNFINISHED*`                         | traversée de boot sans relaunch (statut collant)                                                                                     |

## Flows

### Interruption manuelle (l'utilisateur interrompt le worker)

1. Worker `INPROGRESS*` → `UNFINISHED*` (conservation du drapeau erreurs).
2. Stratégie 2 : le client met les lignes `cs_jobs` non terminales de ce worker en `paused`, et applique immédiatement le mapping → les tâches concernées passent en `POSTED`. Une tâche restée `POSTING` (ligne jamais créée) y gèle telle quelle — il n'y a rien à pauser.
3. Stratégie 1 : rien côté serveur (aucune trace) ; les tâches gardent leur dernier statut connu.
4. Les abonnements realtime du worker sont coupés. Aucun job n'est annulé : mis en `paused`, ils seront repris au relaunch (flip `pending`).

### Crash ou fermeture de l'application (aucune action préalable)

Rien n'est fait côté serveur : les jobs continuent, y compris `processing`.

Au démarrage suivant :

1. Tout worker persisté `INPROGRESS*` est réécrit `UNFINISHED*` (calcul actif au boot, pas dérivé à la lecture).
2. **Livraison des terminaux non livrés de tous les workers** (y compris `UNFINISHED`) : lignes `cs_jobs` en `completed`/`failed` dont le client n'a pas encore pris acte → mise à jour des tâches, puis ack, puis suppression (voir cycle de vie `cs_jobs`).
3. **Sweep** : lignes `cs_jobs` dont le statut terminal est déjà persisté localement mais non supprimées (mort entre persistance et ack) → suppression.
4. Le worker `UNFINISHED` reste `UNFINISHED` (invariant 2) ; ses jobs non terminaux ne sont pas suivis.

### Gelure

Un worker `UNFINISHED` est **gelé** : plus aucun suivi de ses jobs non terminaux, à travers autant de redémarrages que nécessaire. Le flip `paused` → `pending` ne se fait qu'au relaunch, jamais au boot.

### Relaunch (régime unique — `UNFINISHED*` et `COMPLETED_WITH_ERRORS` confondus)

1. Worker → `INPROGRESS` propre (invariant 4).
2. Flip `paused` → `pending` sur les lignes `cs_jobs` **non terminales** de ce worker.
3. Pour chaque tâche **non-`COMPLETED`** (régime unique : `WAITING`, `COMPLETED_WITH_ERRORS` et interrompues sont ré-exécutées ; une `COMPLETED` n'est **jamais** retentée) : lookup par `worker_id` + `task_id` —
   - ligne trouvée → statut déduit du mapping + réabonnement ;
   - ligne absente → ré-exécution (re-post en stratégie 2).
4. Tâches `WAITING` : exécution normale. Tâches interrompues en `INPROGRESS` (stratégie 1) : → `WAITING` → rejeu.
5. Si après le lookup tout est terminal : le worker passe directement en `COMPLETED` / `COMPLETED_WITH_ERRORS`, sans transiter par `INPROGRESS`.

Le flow est **idempotent** (tout passe par lookup) : un relaunch interrompu se reprend sans état spécial.

## Cycle de vie d'une ligne `cs_jobs`

1. Créée `pending` par le post de la tâche (stratégie 2).
2. `processing` → `completed` / `failed` gérés par le serveur (source de vérité).
3. `paused` uniquement par le client, à l'interruption manuelle ; flipé `pending` au relaunch.
4. Terminal livré : le client **persiste d'abord** le statut local de la tâche, **puis** acquitte, **puis** la ligne est supprimée. Une ligne n'est supprimée que lorsque l'information a été persistée côté client.
5. Au boot, le sweep rattrape les lignes terminales dont la persistance locale a eu lieu sans suppression.
6. **Hors périmètre** : lignes orphelines (local perdu — réinstallation, purge de cache). Pas de TTL/purge serveur pour l'instant ; hygiène de table à traiter plus tard si le besoin apparaît.

## Hors périmètre (acté)

- Pause volontaire avec statut dédié (`PAUSED`) : inexistante — interrompre, c'est retourner en `UNFINISHED`.
- Annulation de jobs serveur : aucun `cancelled` dans `cs_jobs` ; l'interruption met en `paused`, rien d'autre.
- Timeout stratégie 1, TTL client sur jobs `processing`, retry par tâche individuelle, multi-instance concurrente, historique de tentatives.

## Implémentation R1

- `WorkerStatus` et `TaskStatus` sont deux enums clos ; `ALL` reste un filtre UI. La migration IndexedDB v31 → v32 convertit les anciennes valeurs et échoue explicitement sur un statut persistant inconnu.
- La loi pure et son tableau exhaustif sont dans `workerStatusLaw.ts`. Repository et saga changent les statuts par événements ; `patch()` ne permet pas de modifier le statut ou la file.
- Le worker est dérivé atomiquement avec sa file lors d'une transition de tâche. Boot et interruption rendent le statut `UNFINISHED*` collant ; relaunch reprend les jobs non terminaux, réexécute les tâches en erreur sans hériter du drapeau, et clôt directement un worker dont toutes les tâches sont déjà réussies.
- Le bridge Supabase mappe les statuts de jobs de façon exhaustive, isole les erreurs par job et ne supprime une ligne terminale qu'après persistance locale. Les jobs terminaux de toutes les catégories de worker sont balayés au démarrage et à la reprise.
- Le timeout de 60 secondes ne concerne que l'attente d'acceptation d'un post en stratégie 2 ; aucun timeout client ne s'applique à `processing`.
- Les plugins émettent des événements plutôt que d'écrire des statuts. L'interface a une table `Record` exhaustive par enum, sans `default`. Le verrou de galerie reste au scope collection (D-008/D3) et la présentation unique respecte D-008/D5.
- Tests dédiés : table de transitions autorisées/refusées, dérivation et récupération, migration réelle v31 → v32, refus d'un `patch()` de statut/file.
