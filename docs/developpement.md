# Guide développeur

_Démarrage et CI vérifiés contre la configuration du dépôt le 2026-11-04. Architecture : [architecture.md](./architecture.md)._

## 1. Démarrage

Prérequis : **Node.js 22** et **npm 11.6.4**, versions utilisées en CI. Le serveur de développement habituel exige aussi un certificat HTTPS local.

```bash
git clone https://github.com/mezanno/corpusense-dev.git
cd corpusense-dev
npm ci
```

Le dépôt ne fournit ni `.env` ni certificats de développement. Créer un `.env.local` ignoré par Git, avec au minimum une URL Supabase valide et une clé anon pour que le client s'initialise :

```dotenv
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
```

Utiliser une instance réellement configurée pour les fonctions distantes ; les autres variables et leurs usages sont décrits dans [architecture.md §9](./architecture.md#9-configuration). Ne jamais mettre de clé secrète dans une variable `VITE_*` : elle est exposée au navigateur.

Installer [mkcert](https://github.com/FiloSottile/mkcert), puis créer les fichiers attendus par `vite.config.ts` :

```bash
mkdir -p certs
mkcert -install
mkcert -key-file certs/localhost+2-key.pem -cert-file certs/localhost+2.pem localhost 127.0.0.1 ::1
npm run dev
```

Ouvrir l'URL HTTPS affichée par Vite. Les certificats et `.env.local` restent locaux. Pour les seuls E2E, aucun certificat n'est nécessaire : Playwright démarre son serveur HTTP dédié.

### Commandes de vérification (le contrôle qualité du dépôt)

```bash
npx tsc -b                              # types, comme en CI
npx vitest run                          # tests
npm run lint:ratchet                    # lint avec baseline, comme en CI
npx prettier . --check                  # format
```

Autres scripts utiles : `npm run build` (generate-env → tsc -b → vite build), `npm run preview`, `npm run test:coverage`, `npm run lint-fix`, `npm run format-fix`.

### Tests E2E (Playwright, Q9)

```bash
npx playwright install chromium  # première utilisation ; --with-deps sous Linux si nécessaire
npm run test:e2e           # npx playwright test — lance son propre serveur `dev:e2e` sur le port 5273
npm run test:e2e:ui        # mode interactif
```

- Specs dans `e2e/` (jamais co-localisées : D-010 réserve `__tests__/` à Vitest) ; chromium seul ; assertions par rôles accessibles et libellés FR réels via `e2e/helpers/selectors.ts` (aucun `data-testid`).
- **Requêtes HTTP interceptées** : `installE2ENetwork` abandonne les requêtes autres que celles du serveur local et de la fixture IIIF (manifest P2, image, `info.json` single-tile), servie sur l'hôte factice `https://iiif.e2e.test` (`e2e/fixtures/README.md`, régénération : `node scripts/generate-e2e-image.mjs`). `page.route` ne filtre pas les WebSockets.
- Environnement de test : `.env.e2e` versionné (valeurs Supabase factices — `createClient()` exige des valeurs valides), serveur HTTP en mode `e2e`, service worker PWA désactivé. Les variables déjà présentes dans l'environnement et `.env.e2e.local` peuvent prendre priorité : éviter d'y injecter une configuration réelle pour ces tests.
- État : IndexedDB vierge par test (contexte neuf) ; les parcours se reconstruisent via `e2e/helpers/journeys.ts`.
- Une spec ne se commite qu'après **10 runs consécutifs** `npx playwright test` verts ; le job CI (`ci.yml`, PR uniquement) téléverse le rapport si le job échoue. La protection de branche doit être configurée séparément pour imposer les checks à la fusion.
- Hors périmètre : workers et jobs distants, IIIF distant réel, import de fichiers locaux, PDF, chaînes de modificateurs, multi-onglets et PWA installée.

## 2. Conventions

- **Alias `@/`** obligatoire pour les imports internes (`@/data/models/…`).
- **Erreurs** : subclasser `BaseError` avec contexte JSON ; jamais `new Error` hors liste blanche ESLint (règle `no-restricted-syntax`, voir D-002). `NotFoundError`, pas l'alias déprécié `EntityNotFoundError`.
- **Résultats attendus** : `FunctionResult<T, E>` aux frontières de commande ; l'absence est une valeur (`undefined`, `[]`), pas une erreur (D-002).
- **Repository ≠ DAO** : le vocabulaire exact est dans `CONTEXT.md` ; tout accès passe par `dbFactory.ts`.
- **Tests co-localisés** dans `__tests__/` à côté de la source ; composants testés via les rôles accessibles et `user-event` (D-010). Ce qui touche un repository se teste avec `fake-indexeddb` sur le vrai stack Dexie, en réinitialisant la base via `createTestDb()` (D-004, R3.1).
- **Nommage de fichiers** : PascalCase pour les composants, kebab-case autorisé uniquement dans `components/ui/` (fichiers shadcn régénérés).
- **Zod** : toute entité persistée complexe a son schéma (`.strict()` là où c'est déjà le cas).
- **i18n** : les chaînes UI passent par les clés ; le mock de test renvoie les clés à l'identique, donc les tests vérifient les clés.
- **Sous-répertoire** : ne jamais hardcoder d'URL absolue — utiliser `VITE_BASE_PATH` et les helpers de `useAppNavigation`.

## 3. Harnais de test (à connaître avant de toucher les tests)

- `vitest.setup.ts` : stub `ResizeObserver` (**requis** par `@dnd-kit/dom` — sans lui, 8 fichiers ne se chargent plus), stub `matchMedia`, mock WebGL via `vitest-webgl-canvas-mock`.
- Mock i18n : `src/__tests__/react-i18next.ts` (alias du paquet réel via vite.config) exporte `useTranslation` **et** `Trans`.
- Vérification Vitest du 2026-10-12 : 25 fichiers réussis, 1 ignoré (`ManifestDetails.test.tsx`), 98 tests réussis et 1 `it.todo`. Baseline statique mesurée le 2026-10-08 : tsc vert ; ESLint `src` : 48 erreurs / 2 warnings.

## 4. Guides

### Ajouter une route

1. Clé dans `CorpusenseRoutes` (`src/hooks/useAppNavigation.tsx`) + helper `goTo…()`.
2. Page dans `src/pages/`.
3. `<Route …>` dans `App.tsx` sous `<Route element={<Layout />}>`.

### Ajouter un worker (OCR / LLM / traitement)

1. Fichier dans `src/state/sagas/plugins/workers/` — découvert automatiquement (D-007). Marquer `experimental` si pertinent.
2. Le plugin émet des **événements de statut**, jamais des statuts bruts (D-008) ; erreurs en sous-classes de `BaseError` nommant le job (D-002).
3. Côté export : réutiliser les utilitaires communs, pas de nouvel utilitaire d'écriture.

### Ajouter un modèle métier

1. Type + schéma Zod dans `src/data/models/`.
2. Store dans `db.ts` : nouvelle `db.version(N+1)` avec la **liste complète des stores** et les index, migration dans `.upgrade()`.
3. Repository dans `src/data/repositories/indexeddb/` + getter dans `dbFactory.ts`.
4. Hook live dans `src/hooks/data/` (`useLiveQuery`).
5. Route + page + test.

### Carte de navigation (« où chercher quand… »)

| Je veux…                               | Regarder                                                        |
| -------------------------------------- | --------------------------------------------------------------- |
| Ajouter/modifier une page ou route     | `src/pages/`, `src/App.tsx`, `src/hooks/useAppNavigation.tsx`   |
| Modifier le visualiseur / l'annotation | `src/components/features/canvasViewer/CanvasViewerOSD*.tsx`     |
| Modifier le schéma de base             | `src/data/repositories/indexeddb/db.ts`                         |
| Ajouter un accesseur de données        | `src/data/repositories/indexeddb/` + `dbFactory.ts`             |
| Ajouter un worker / importer           | `src/state/sagas/plugins/`                                      |
| Modifier les types métier              | `src/data/models/`                                              |
| Suivi jobs distribués                  | `src/hooks/useJobRealtime.tsx`, `src/utils/supabase.ts`         |
| Configuration / clés API               | `src/utils/config.ts`, `src/components/features/configuration/` |
| Build, PWA, chunks                     | `vite.config.ts`                                                |
| Déploiement                            | `.github/workflows/deploy.yml`                                  |

## 5. Pièges connus

1. **Migrations Dexie** : `.upgrade()` ne fait que le structurel ; la migration `storedManifests/convertedFiles → sources` est déclenchée manuellement depuis l'UI (`migrateAllSources()`). Toujours figer l'ordre des tableaux avant de supprimer un champ de tri (cf. v31).
2. **Mock i18n** : ajouter une fonction i18n utilisée par un composant testé ⇒ l'ajouter au mock, sinon l'import explose.
3. **Plugins expérimentaux** : invisibles tant que le drapeau `experimental_features` (localStorage) est désactivé.
4. **Deux registries de plugins** : `App.tsx` (UI) et `sagas/workers.ts` (exécution) chargent chacun leur copie — dette roadmap Q6.
5. **Imports transverses interdits** (future règle de lint d'architecture, roadmap Q4) : `src/data/**` ne doit rien importer de `@/App` ni des stores UI ; deux violations existent (`data/utils/plugins.ts`, `data/models/worker/worker.utils.ts`).
6. **Documentation de l'app** : `DocumentationPage` sert les Markdown de `public/doc/` listés dans `index.json` — la doc technique n'y a pas sa place (voir [README.md](./README.md)).
7. **E2E Playwright** (Q9, enseignements des specs `e2e/`) :
   - `download.path()` est la fin autoritaire du flux en Node — `download.finished()` n'existe pas côté JS ;
   - le build jszip installé rejette `loadAsync(stream)` : tamponner `createReadStream()` en mémoire avant lecture ;
   - ne pas remettre d'`id` explicite sur un `Checkbox` dans un `FormControl` : il court-circuite l'id injecté et casse l'association `FormLabel`↔contrôle (corrigé dans `ExportCollectionForm` grâce à l'E2E) ;
   - `fill` ne déclenche pas la validation react-hook-form : tout champ pilotant un bouton `disabled` se remplit au clavier (`pressSequentially`) ;
   - le drawer WebGL d'OpenSeadragon 5 n'émet **jamais** `tile-drawn` : attendre le rendu par le réseau (`info.json` + tuile) et assertir sur l'overlay annotorious (`svg.a9s-annotationlayer`) ; après un reload, seules les peintures WebGL et la preuve IndexedDB/menu subsistent, pas le nœud SVG ;
   - le geste de dessin repose sur la géométrie figée du viewport du projet chromium (1280×720, `defaultZoomLevel` 0.5) : changer le `viewport` impose de relancer les 10 runs de stabilité ;
   - la ligne de log d'export `Export completed successfully.` (`LOG_EXPORT_COMPLETED` du logger) n'est pas traduite.
