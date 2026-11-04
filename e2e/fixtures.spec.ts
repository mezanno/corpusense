import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { E2E_IMAGE_SERVICE_URL, E2E_MANIFEST_URL } from './helpers/fixtures';
import { installE2ENetwork } from './helpers/network';

// Étape 2 du plan Q9 — preuve automatique du harnais : les fixtures IIIF sont servies
// en interception depuis le disque, tout le reste du réseau est abandonné, et le
// visualiseur OpenSeadragon (bundle réel de l'app) accepte l'info.json « single-tile »
// (spike qui prépare l'étape 4 sans engager le scénario S3).

/** Vue Presentation 2 minimale du manifest de test, pour typer les assertions. */
interface Presentation2Fixture {
  '@context': string;
  '@id': string;
  label: string;
  sequences?: { '@id': string; canvases?: { '@id': string; width: number; height: number }[] }[];
}

/** Vue Image API 2.0 de l'info.json de test. */
interface Image2InfoFixture {
  '@context': string;
  '@id': string;
  width: number;
  height: number;
  tiles?: { width: number; height: number; scaleFactors: number[] }[];
  profile: string[] | string;
}

test.describe('harnais fixtures IIIF', () => {
  test.beforeEach(async ({ page }) => {
    await installE2ENetwork(page);
  });

  test('le manifest de test est servi depuis le disque', async ({ page }) => {
    // On part de l'application réelle : les fetch cross-origin depuis l'origine de
    // l'app sont exactement ce que fera l'importeur par défaut aux étapes 3-4.
    await page.goto('/');

    const manifest = await page.evaluate(async (url) => {
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      const body = (await response.json()) as Presentation2Fixture;
      return { status: response.status, contentType: response.headers.get('content-type'), body };
    }, E2E_MANIFEST_URL);

    expect(manifest.status).toBe(200);
    expect(manifest.contentType).toContain('application/json');
    // Format Presentation 2, seul digéré par convertJsonToManifest (convertPresentation2).
    expect(manifest.body['@context']).toBe('http://iiif.io/api/presentation/2/context.json');
    expect(manifest.body['@id']).toBe(E2E_MANIFEST_URL);
    expect(manifest.body.label).toBe('Manifeste de test E2E');
    const canvases = manifest.body.sequences?.[0]?.canvases;
    expect(canvases).toHaveLength(1);
    expect(canvases?.[0]?.width).toBe(1024);
    expect(canvases?.[0]?.height).toBe(768);
  });

  test('le service IIIF factice sert info.json (single-tile) et l’image', async ({ page }) => {
    await page.goto('/');

    const info = await page.evaluate(async (url) => {
      const response = await fetch(`${url}/info.json`);
      const body = (await response.json()) as Image2InfoFixture;
      return { status: response.status, contentType: response.headers.get('content-type'), body };
    }, E2E_IMAGE_SERVICE_URL);

    expect(info.status).toBe(200);
    expect(info.body['@context']).toBe('http://iiif.io/api/image/2/context.json');
    expect(info.body['@id']).toBe(E2E_IMAGE_SERVICE_URL);
    expect(info.body.width).toBe(1024);
    expect(info.body.height).toBe(768);
    // Single-tile : une tuile unique couvrant toute l'image, facteur d'échelle 1.
    expect(info.body.tiles).toEqual([{ width: 1024, height: 768, scaleFactors: [1] }]);
    expect(info.body.profile).toContain('http://iiif.io/api/image/2/profiles/level2.json');

    // L'image est décodée par le navigateur (createImageBitmap) : dimensions figées,
    // cohérentes avec info.json et avec le manifest.
    const image = await page.evaluate(async (url) => {
      const response = await fetch(url);
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);
      const result = {
        status: response.status,
        contentType: response.headers.get('content-type'),
        width: bitmap.width,
        height: bitmap.height,
        bytes: blob.size,
      };
      bitmap.close();
      return result;
    }, `${E2E_IMAGE_SERVICE_URL}/full/full/0/default.jpg`);

    expect(image.status).toBe(200);
    expect(image.contentType).toBe('image/jpeg');
    expect(image.width).toBe(1024);
    expect(image.height).toBe(768);
    expect(image.bytes).toBeGreaterThan(0);

    // Une URL inconnue sur l'hôte factice répond 404 (pas de repli silencieux).
    const statutManquant = await page.evaluate(
      async () => (await fetch('https://iiif.e2e.test/introuvable.json')).status,
    );
    expect(statutManquant).toBe(404);
  });

  test('toute sortie externe est abandonnée', async ({ page }) => {
    await page.goto('/');

    const statuts: Record<string, string> = {};
    for (const url of [
      'https://gallica.bnf.fr/iiif/ark:/12148/bd6t543024772/manifest.json',
      'https://e2e.supabase.co/rest/v1/cs_jobs',
      'https://fonts.gstatic.com/',
    ]) {
      statuts[url] = await page.evaluate(
        (target) =>
          fetch(target)
            .then(() => 'ok')
            .catch(() => 'abandonné'),
        url,
      );
    }

    expect(Object.values(statuts)).toEqual(['abandonné', 'abandonné', 'abandonné']);
  });
});

// Spike préparant l'étape 4 : le visualiseur de l'app ouvre `{service.id}/info.json`
// (src/hooks/data/sources/useTileSource.tsx). On rejoue ici cette requête exacte avec
// le bundle OpenSeadragon réel (`node_modules/openseadragon/build/...`, le même que
// celui que l'app charge) et la fixture servie en interception : si le titre passe à
// « osd:ouvert », la tuile unique a été chargée puis dessinée.
//
// Deux enseignements du spike (2026-10-13), à rappeler à l'étape 4 :
// - charger les tuiles en AJAX (`loadTilesWithAjax: true`, l'option de l'app, cf.
//   CanvasViewerOSDContent) : sans cela l'image cross-origin est marquée « tainted »
//   et le drawer WebGL refuse de la dessiner malgré nos en-têtes CORS ;
// - le drawer WebGL (par défaut dans l'app) n'émet JAMAIS `tile-drawn` (rejet
//   explicite d'OSD 5). Ici on force le drawer 2D (`drawer: CanvasDrawer`, l'option
//   `useWebGL` est dépréciée en OSD 5) pour obtenir ce signal de preuve ; à l'étape 4,
//   l'assertion devra cibler l'overlay annotorious, pas `tile-drawn`.
const OSD_BUNDLE = fileURLToPath(
  new URL('../node_modules/openseadragon/build/openseadragon/openseadragon.js', import.meta.url),
);

const SPIKE_HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>osd:attente</title>
    <style>html, body, #osd { height: 100%; margin: 0; }</style>
  </head>
  <body>
    <div id="osd"></div>
    <script src="/__e2e__/osd.js"></script>
    <script>
      const viewer = new OpenSeadragon({
        element: document.getElementById('osd'),
        tileSources: ['${E2E_IMAGE_SERVICE_URL}/info.json'],
        loadTilesWithAjax: true,
        drawer: OpenSeadragon.CanvasDrawer,
        showNavigator: false,
        showHomeControl: false,
        showFullPageControl: false,
        showSequenceControl: false,
      });
      viewer.addOnceHandler('tile-drawn', () => {
        document.title = 'osd:ouvert';
      });
      viewer.addOnceHandler('open-failed', () => {
        document.title = 'osd:echec';
      });
      viewer.addHandler('tile-load-failed', () => {
        document.title = 'osd:echec';
      });
    </script>
  </body>
</html>`;

test.describe('spike visualiseur (préparation étape 4)', () => {
  test('OpenSeadragon ouvre le service IIIF single-tile de la fixture', async ({ page }) => {
    await installE2ENetwork(page);
    // Enregistrées APRÈS le harnais : route la plus récente prioritaire, sinon la
    // catch-all « continue » l'origine locale vers vite, qui renverrait l'application.
    await page.route('**/__e2e__/osd.js', (route) =>
      route.fulfill({
        contentType: 'text/javascript',
        body: readFileSync(OSD_BUNDLE, 'utf8'),
      }),
    );
    await page.route('**/__e2e__/spike.html', (route) =>
      route.fulfill({ contentType: 'text/html; charset=utf-8', body: SPIKE_HTML }),
    );

    await page.goto('/__e2e__/spike.html');

    // Web-first : on attend l'événement de dessin de la tuile, jamais une durée ;
    // délai confortable pour le parse du bundle (~1 Mo) sur les CI lentes.
    await expect(page, 'OSD doit dessiner la tuile unique de la fixture').toHaveTitle(
      'osd:ouvert',
      { timeout: 15_000 },
    );
  });
});
