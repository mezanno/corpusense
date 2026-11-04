# DATA

## Modèle de données observé (OBSERVED)

Cinq couches distinctes, toutes présentes dans le source :

```text
Concept métier   →  Vocabulaire versionné (CONTEXT.md) : Collection, Canvas, Source, Worker, Task…
Modèle applicatif→  Types + schémas de validation (Zod, .strict() sur les entités complexes)
Représentation   →  DTO d'entrée (*CreateDTO) ; séparation *Details (léger) / *Content (payload lourd)
Persistence      →  Stores indexés (Dexie v32, 20 stores), migrations versionnées .upgrade()
```

Points saillants transférables :

1. **Séparation Details/Content** : les métadonnées légères s'affichent en liste, le payload lourd (blobs, contenu) se charge à la demande. Ce découpage est un **pattern de modèle**, indépendant de l'ORM.
2. **DTO d'écriture dédiés** (`*CreateDTO`) : la frontière d'entrée d'un repository n'est jamais l'entité complète ; le repository fabrique l'entité (id, dates, invariants).
3. **Schéma = validation = type** : l'entité persistée complexe est définie par son schéma de validation ; le type en découle. L'import de données externes (backup JSON) devrait passer par le même schéma (lacune reconnue S-08).
4. **Migrations versionnées et conservatrices** : schéma versionné (`db.version(N)` avec liste complète des stores+index), montée par `.upgrade()` ; les valeurs persistées hors alphabet sont **rejetées explicitement** par la migration (v31→v32), pas tolérées silencieusement. Migration structurelle auto ≠ migration de contenu : la migration lourde (`storedManifests → sources`) est déclenchée depuis l'UI — compromis assumé et documenté comme piège ; toute suppression de champ indexé ordonné se prépare, se consigne, se vérifie.
5. **Invariants inter-stores dans les repositories d'agrégat** seulement (Sources, Collections, Annotations, Workers) ; le CRUD monoclore reste une couche mince. (Vocabulaire « Table/Provider » bancassé puis abandonné — D-005 : une abstraction de plus étudiée et **refusée proportionnément**, ce qui est en soi une fondation méthodologique.)
6. **Annotations au format standard du domaine** (W3C Web Annotation Data Model, motivations `classifying`+`tagging`) : préférer un standard du domaine à un format maison — transférable à n'importe quel domaine qui a un standard.
7. **Historique et suppression douce observés** : store `history` (URLs), `annotationsTemp` pour le travail non consolidé ; nettoyage des tables legacy commenté → **dette reconnue** (données dupliquées persistent après migration, S-10).

## Persistance (OBSERVED)

- Choix : IndexedDB local-first (D-001). **Le principe transférable** n'est pas « IndexedDB » mais : la donnée de travail appartient à l'utilisateur, survit au offline, et l'application reste fonctionnelle sans service distant (les jobs distants sont optionnels et pontés).
- Abonnement réactif aux tables = mechanism de rafraîchissement de l'UI ; aucune invalidation manuelle de cache à écrire pour la donnée métier.
- Transactions : les opérations multi-écritures (transition de statut + file + statut dérivé) se font **dans une transaction unique** du repository.
- Export/import de la base entière (portabilité) : backup restaurable, mais import sans validation de schéma → lacune S-08 à corriger dès un nouveau projet.

## Cache et données externes (OBSERVED)

- Données externes ponctuelles (manifestes, conversions) via une couche de fetch avec cache/invalidation (React Query) ; jamais recopiées dans la base locale.
- Miniatures et blobs : stockés comme pièces jointes séparées ; **lacune reconnue** (R5) : le concept « blob + sa forme base64 » est dupliqué dans ~15 fichiers sans module — leçon : dès qu'un format de representation se duplique, nommer et extraire le module (`put/get/remove/asBase64/fromBase64`).

## Configuration des données (INFERRED)

- Ordres de tri figés avant suppression d'un champ de tri (leçon de la migration v31) : **toute suppression de champ indexé ordonné se prépare**, se consigne, se vérifie.

## Recommandations pour un nouveau projet (RECOMMENDED)

1. Reprendre la séparation Details/Content + DTO d'écriture dès le premier modèle.
2. Schéma de validation unique par entité persistée, utilisé aussi pour valider tout import.
3. Migrations versionnées testables sur le vrai moteur (ou un faux moteur fidèle — voir TESTING.md).
4. Migration de données = alphabets clos : valeur inconnue ⇒ rejet typé.
5. Si l'architecture n'a pas encore plusieurs adaptateurs de persistance réels, **ne pas introduce une couche « Table/Provider » speculative** (leçon D-005, appliquée par le source lui-même).
