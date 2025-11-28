# Gestion d'État (State Management)

## Analyse Actuelle
Le projet utilise une combinaison de Redux Toolkit (avec Sagas), Zustand et React Query.

## Points d'Amélioration

### 1. Clarification des Rôles et Options pour Dexie

Vous avez tout à fait raison de soulever ce point. Si votre "source de vérité" est locale (IndexedDB via Dexie), **React Query n'est pas forcément la meilleure solution par défaut** pour lire ces données, bien qu'il puisse gérer n'importe quelle promesse.

#### Option A : Dexie `useLiveQuery` (Recommandée pour le local)
Puisque vous utilisez déjà `dexie-react-hooks`, c'est l'option la plus performante et la plus simple pour les données locales.
- **Avantage** : C'est **réactif**. Si vous ajoutez un élément dans la DB (via un worker ou une autre action), le composant se met à jour *automatiquement* sans avoir besoin d'invalider un cache manuellement.
- **Usage** : Remplacer les sélecteurs Redux qui lisent les données par des hooks `useLiveQuery`.

#### Option B : React Query (TanStack Query)
- **Usage** : À privilégier pour les **données distantes** (API REST, chargement initial de Manifestes IIIF depuis une URL) ou pour des calculs asynchrones lourds qui ne viennent pas directement de la DB.
- **Pattern "Offline-First"** : Souvent, on utilise React Query pour *fetcher* les données serveur et les synchroniser dans Dexie, mais l'UI, elle, lit Dexie via `useLiveQuery`.

#### Option C : Redux + Sagas (Actuel)
- **Inconvénient** : Pour lire IndexedDB, vous devez actuellement : déclencher une action -> Saga -> lire DB -> mettre dans le store Redux -> Sélecteur. C'est beaucoup d'étapes pour afficher une donnée qui est déjà stockée localement.

**Nouvelle Recommandation Stratégique** :
1.  Utiliser **`useLiveQuery`** pour toute lecture de données persistées localement (Collections, Annotations stockées).
2.  Garder **React Query** uniquement pour les appels réseaux externes directs (s'il y en a) ou pour gérer la synchronisation.
3.  Garder **Zustand** pour l'état UI volatile (menus ouverts, sélection courante temporaire).


### 2. Sélecteurs
L'utilisation de sélecteurs mémosés (Reselect) est une bonne pratique observée.
- **Recommandation**: Continuer à utiliser des sélecteurs pour dériver les données et éviter les calculs coûteux dans les composants.

### 3. Context API
Pour les états très locaux (ex: état d'un formulaire complexe ou d'un composant composé), ne pas hésiter à utiliser le Context API de React pour éviter de polluer le store global.
