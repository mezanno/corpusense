# TECHNICAL-DEBT

Deux volets : ce qui **existe** et ne doit pas être reproduit (§1), ce qui **manque** et devrait exister dès le nouveau projet (§2).

## 1. Dette du projet source (OBSERVED) — à ne pas transposer

| Problème | Impact | Pourquoi il existe probablement | Recommandation pour le nouveau projet | Priorité* |
|---|---|---|---|---|
| Saga d'orchestration ~420 lignes : loi + file + reprise + mapping mêlés | Non testable, point chaud de modification | Croissance historique de l'orchestration avant l'existence de la loi pure | Démarrer directement avec un moteur de file à ports (P6) ; la loi dans un module pur dès le départ | Haute |
| Duplication des plugins LLM (~200 lignes quasi identiques, triplication des exports) | Divergences (fichiers `mistral_export_*` produits par le plugin OpenAI) | Copier-coller d'un premier adaptateur réussi | Un seul worker paramétré par adaptateur de client ; flux d'export écrit une fois | Haute |
| Double registry de plugins (UI vs exécution) | Deux vues divergentes des plugins disponibles | Deux points de chargement apparus à des époques différentes | Un registry unique, même manuel | Haute |
| Trois niveaux « utils » (`lib/`, `utils/`, `data/utils/`) + doublons d'helpers | Navigabilité, import hasardeux | Absence de destination par défaut pour « petit helper » | Une destination nommée par famille de helpers ; un utils partagé = un module nommé | Moyenne |
| Violations de couches (`data/**` → UI/App, 2 cas) | La règle de dépendances n'est pas tenue mécaniquement | Pas de lint d'architecture (Q4) | Règle de lint de frontières **au premier commit** | Haute (prévention) |
| ~59 `console.log` dont payloads externes | Fuite d'info, bruit, S-09 | Développement sans module de logging | Module de logging + lint anti-console | Moyenne |
| Dépendances : `xlsx` vulnérable sans fix, `cozy-iiif` non épinglé, `tesseract` mort au manifest | Supply chain (S-05), audit non bloquant | Choix historiques + absence de politique | Politique épinglage SHA + revue trimestrielle + audit bloquant | Haute |
| `stats.html` 1,9 Mo et `.env` commités par le passé | Pollue l'historique, leurre de sécurité | `gitignore` ajouté après coup | Hook pré-commit + `.gitignore` au premier commit | Basse (dans un projet neuf : prévention) |
| Tables legacy commentées non purgées après migration | Données dupliquées persistantes (S-10) | Peur de casser une migration non validée | Migration = test + purge dans la même version, validée par test | Moyenne |
| `useDialog` : 447 lignes, 23 wrappers, ~43 sites d'import | Point chaud, couplage fort UI↔formulaires | Dialogues empilés sans abstraction de formulaire | Cible du source : registre de formulaires + `openForm()` — à reprendre comme **conception initiale**, pas comme dette | Moyenne |
| Concept blob/base64 dupliqué (~15 fichiers, ~40 lignes) | Cinq adaptateurs sans foyer | Pas de module « pièce jointe » | Module d'attachments nommé dès les premiers modèles | Moyenne |

\* Priorité dans l'optique du **nouveau projet** (prévention), pas du source.

Le source lui-même classe et priorise sa dette (roadmap Q1-Q9, registre S-01..S-11) — **cette discipline de registre est la fondation à prendre, l'inventaire ci-dessus n'est que l'application au cas présent.**

## 2. Éléments manquants au source, à ajouter au nouveau projet

### OBLIGATOIRE

1. **Garde d'architecture mécanique** : règles de lint par frontières de couches (le source le prévoit en Q4, ne l'a pas fait) ; sans lui, la règle de dépendances est une tradition orale.
2. **Protection de branches** rendant le pipeline de validation bloquant à la fusion (Q3 inachevé côté réglages de dépôt).
3. **Validation par schéma de toute entrée non contrôlée** : imports de données, slugs, contenu distant (S-06/S-08 ferment en même temps).
4. **Sanitisation du rendu** de tout contenu markdown/HTML produit hors de l'app (S-07).
5. **Module de logging unique** avec niveaux et politique de production (S-09).
6. **Hook anti-secrets + `.gitignore` + épinglage des dépendances** au premier commit (S-05/S-11) : ces trois-là coûtent zéro sur un projet neuf.

### RECOMMANDÉ

7. **CSP `default-src 'self'` + `connect-src` borné** dès le squelette (S-03).
8. **Seuil de couverture** ciblé sur les modules de loi et les adaptateurs (pas un % global).
9. **Feedback UI des erreurs de démarrage des traitements** (le source avale les erreurs de démarrage de worker, roadmap Q8).
10. **Métadonnées de version** exposées (cf. OBSERVABILITY.md) et canal stable/test explicite.
11. **SBOM ou revue de dépendances outillée** si la cible a un registre de paquets.

### OPTIONNEL

12. Métriques/traces si un service central existe (sinon inutile — cohérent avec le local-first).
13. Système de feature-flags au-delà d'un drapeau unique `experimental`.
14. Snapshots visuels E2E.

## 3. Avertissement méthodologique (RECOMMENDED)

Le source a refusé une abstraction étudiée sérieusement (D-005) et l'a consignée comme refus définitif. Un nouveau projet héritant de ces fondations **ne doit pas la réintroduire par réflexes architecturaux** (« il faut une couche repository/adapter ») : la règle est « une abstraction par besoin observé au call site ». Ne pas transformer non plus chaque écart à une architecture idéale en dette : le source assume cinq mécanismes d'état parce que chacun est justifié par écrit.
