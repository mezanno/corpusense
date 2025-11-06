# CorpuSense

## Dépôts

### <https://github.com/mezanno/corpusense>

Il s'agit du dépôt principal de CorpuSense. Composé de 3 branches :

- main
- develop : branche destinée à recevoir les PR des forks du dépôt
- gh-pages : branche contenant le build de l'application (généré automatiquement lors d'un push sur la branche develop)

### <https://github.com/mezanno/corpusense-dev>

Il s'agit d'un fork. Composé de 2 branches :

- develop : branche de développement
- gh-pages : branche contenant le build de l'application (généré automatiquement lors d'un push sur la branche develop)

Cette structure nous permet d'avoir en ligne 2 builds :

- <https://mezanno.xyz/corpusense/> : version stable de l'application
- <https://mezanno.xyz/corpusense-dev/> : version d'essai de l'application utilisée pour les tests lors du développement

## Technos utilisées

- React : https://react.dev/
- Redux (store) : https://redux.js.org/
- Redux-Saga (opérations asynchrones) : https://redux-saga.js.org/
- Shadcn/UI (composants React): https://ui.shadcn.com/
- Tailwind CSS (framework CSS): https://tailwindcss.com/
- Dexie (wrapper pour IndexedDB): https://dexie.org/
- Annotorious + OpenSeaDragon (affichage d'images IIIF + annotation d'images) : https://annotorious.dev/
-
