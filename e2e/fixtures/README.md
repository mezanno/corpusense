# Fixtures E2E (Q9)

Fixtures servies **en interception** par le harnais Playwright (`e2e/helpers/fixtures.ts`)
sur l'hôte factice `https://iiif.e2e.test/...` — elles ne quittent jamais la machine,
tout le reste du réseau est abandonné (`e2e/helpers/network.ts`).

## Contenu

| Fichier         | Rôle                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `manifest.json` | Manifeste IIIF Presentation **2**, 1 canvas (1024×768), 1 image. Écrit à la main.                                              |
| `image.jpg`     | JPEG déterministe 1024×768 (aplats + bandes de contrôle), référence graphique des scénarios d'annotation (S3). Généré.         |
| `info.json`     | Réponse IIIF Image API 2.0 « single-tile » du service `https://iiif.e2e.test/image`, chargée par le visualiseur OpenSeadragon. |

## Pourquoi Presentation 2 et pas 3

`convertJsonToManifest` (`src/utils/manifest.ts`) passe **inconditionnellement** par
`convertPresentation2` de `@iiif/parser` — même le manifeste de référence réel lié dans
`Welcome.tsx` (Gallica) est du Presentation 2. Un fixture P3 échouerait au pipeline
(`fetchManifest` → importeur `default` → `convertJsonToManifest`). Le fixture est donc
rédigé en P2, avec un `service` IIIF Image 2.0 sur l'image du canvas, ce qui produit
après conversion un `ImageService2` P3 exploité par `useTileSource` (`{service.id}/info.json`).

Vérifié par spike Node (2026-10-13) : `convertPresentation2(fixture)` → `Cozy.parse(...)`
depuis `cozy-iiif` renvoie `type: 'manifest'`, `getSummary() = 'Manifeste de test E2E'`,
1 canvas ; les étapes aval (thumbnail via `getThumbnailBlob`, stores Dexie via
`ManifestSchema = z.custom()`) digèrent aussi cette forme. Le test Playwright
`fixtures.spec.ts` prouve le service en interception.

## URL utilisable dans l'UI

`https://iiif.e2e.test/manifest.json` passe le garde-fou `isManifestUrl()` (tout
`http(s)`), peut donc être saisi dans le champ « Charger un manifest IIIF » et suit le
même chemin que Gallica (importeur `default`, l'URL ne contenant pas `bnf.fr`).

## Régénération de l'image

```bash
node scripts/generate-e2e-image.mjs
```

Le script (`scripts/generate-e2e-image.mjs`) régénère **`image.jpg` et `info.json`
ensemble** pour que les dimensions restent synchronisées. Déterminisme : géométrie
pure, aucun texte, encodage JPEG de la version épinglée de `canvas` ; deux exécutions
successives produisent des octets identiques (vérifié sha256). À relancer seulement
si l'on change dimensions ou composition ; les binaires versionnés sont la référence.
