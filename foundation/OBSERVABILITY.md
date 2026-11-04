# OBSERVABILITÉ

Le point le plus faible du projet source : l'observabilité est **réduite à l'état**, mais l'état existant est déjà structuré en principe/implémentation/technologie. À reproduire : le peu qui marche ; à corriger : le reste.

## Ce qui existe (OBSERVED)

| Principe                                        | Implémentation                                                                           | Technologie                                    |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Identifier chaque build publié                  | version+git hash+date injectés au build dans un fichier env généré (jamais commité)      | script de build + variables de build           |
| Signaler les événements système à l'utilisateur | file d'événements INFO/ERROR avec `lastEvent` consommé puis réinitialisé                 | store global minimal (slice `events`) + toasts |
| Journaliser les cycles de vie longs (workers)   | statuts persistés + historique de tâches consultable dans l'UI (c'est la « log » métier) | base locale + écrans de suivi                  |
| Corréler une erreur à son job                   | erreurs de plugin nommant plugin/tâche/URL dans message et `context` JSON                | hiérarchie `BaseError` (D-002)                 |
| Éviter le bruit en production                   | suppression du debug inconditionnel de l'ORM (registre S-02 clos)                        | défauts constructeur de l'ORM                  |
| Preuve de test déterministe                     | rapport E2E + traces téléversés au 1er échec, rétention 7 j                              | artefacts CI                                   |

## Lacunes (OBSERVED, consignées dans le registre de sécurité/roadmap)

- ~59 `console.log` en production, dont des payloads de services externes (S-09).
- Aucun module de logging unique, aucun niveau, pas de corrélation inter-opérations.
- Pas de métriques, pas de traces, pas de health/version endpoint exposable.

## Recommandations pour un nouveau projet (RECOMMENDED)

1. **OBLIGATOIRE** : un seul module de logging, avec niveaux, activé par configuration ; suppression des logs en production de build (`drop`/niveau minimal). La transposition du ratchet s'applique : interdire par lint l'usage direct des primitives de console hors ce module.
2. **OBLIGATOIRE** : les erreurs structurées sont le premier canal d'observabilité — le `context` JSON des erreurs typées (P1) est déjà un mini-log corrélé : le conserver et le sérialiser au boundary.
3. **RECOMMANDÉ** : journal d'événements système en base locale (l'UI de journalisation du source est un bon modèle : l'utilisateur final peut voir ce qui a échoué sans outil de dev).
4. **RECOMMANDÉ** : métadonnées de build (version, hash, date) exposées dans l'UI À propos et dans un endpoint/fichier servi, pour dater un comportement constaté.
5. **RECOMMENDED** : si un service central existe, traces/métriques par l'API standard de l'écosystème (OpenTelemetry côté serveur) avec identifiant de corrélation propagé ; sinon, s'en tenir à 1-4 — le source démontre qu'une app locale n'a pas besoin de APM pour être opérable.
6. **OPTIONNEL** : comptage d'usage anonymisé, sous réserve d'un choix explicite de consentement (absent du source).
