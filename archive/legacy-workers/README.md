# Workers legacy — archive

Anciens plugins de workers retirés du chargement applicatif et conservés pour référence.
Ils ne sont **ni compilés, ni lintés, ni testés, ni bundlés** : le dossier est hors de
`src/` (`include` du tsconfig) et ignoré par ESLint et Prettier.

## Contenu

| Fichier               | Rôle                                                                        |
| --------------------- | --------------------------------------------------------------------------- |
| `tesseract.ts`        | Worker OCR local via `tesseract.js`                                          |
| `suryaCommon.ts`      | Base commune des workers SuryA (OCR, layout, tables)                         |
| `suryaOcr.ts`         | Worker SuryA OCR                                                             |
| `suryaLayout.ts`      | Worker SuryA extraction de mise en page                                      |
| `suryaTable.ts`       | Worker SuryA extraction de tableaux                                          |
| `edwin.ts`            | Worker Edwin (magique)                                                       |
| `suryaConverter.ts`   | Convertisseur de résultats SuryA (dépendance de `suryaCommon.ts` uniquement) |

## Pourquoi cet archive

Ces workers sont du code mort assumé : le registre par découverte dynamique (D-007,
`import.meta.glob`) ne descend pas dans les sous-répertoires, ils n'étaient donc plus
chargés. Leur présence sous `src/` coûtait une dépendance runtime (`tesseract.js`) et
une surface d'analyse inutile (roadmap Q5). Déplacés ici le 2026-10-12 ; l'historique
complet est conservé (`git log --follow`, tag `archive/legacy-workers`).

## Ressusciter un worker

1. Recopier les fichiers concernés dans `src/state/sagas/plugins/workers/`
   (et `suryaConverter.ts` dans `src/data/models/converters/`).
2. Réinstaller la dépendance : `npm i tesseract.js@^6.0.1`.
3. Vérifier les imports (`@/`…) et les statuts utilisés face à la loi de statut
   actuelle (`docs/statuts.md`) — ces plugins datent d'avant R1 et écrivaient des
   statuts bruts, contraire à D-008.
