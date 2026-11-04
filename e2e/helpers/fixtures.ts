import type { Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';

// Harnais de fixtures IIIF (Q9, étape 2) : sert les fixtures du disque sur l'hôte
// factice `iiif.e2e.test`, intercepté par `page.route`. Rien n'est envoyé sur le
// réseau : les réponses sont fabriquées depuis `e2e/fixtures/`.
//
// À enregistrer APRÈS `blockExternalRequests` (la route enregistrée en dernier est
// prioritaire sur la catch-all qui avorte tout) — `installE2ENetwork` garantit cet ordre.

/** Origine factice des fixtures IIIF ; toute URL en `http(s)` passe `isManifestUrl()`. */
export const IIIF_FIXTURE_ORIGIN = 'https://iiif.e2e.test';

/** Route Playwright unique couvrant toutes les fixtures (manifest, images, info.json). */
export const IIIF_FIXTURE_PATTERN = '**iiif.e2e.test**';

/** URL du manifest de test, à saisir dans le champ « Charger un manifest IIIF ». */
export const E2E_MANIFEST_URL = `${IIIF_FIXTURE_ORIGIN}/manifest.json`;

/** URL du service IIIF Image référencé par le manifest (spike visualiseur, étape 4). */
export const E2E_IMAGE_SERVICE_URL = `${IIIF_FIXTURE_ORIGIN}/image`;

const fixturePath = (name: string): string =>
  fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));

const MANIFEST_FIXTURE = fixturePath('manifest.json');
const INFO_FIXTURE = fixturePath('info.json');
const IMAGE_FIXTURE = fixturePath('image.jpg');

// Les fixtures sont chargées depuis l'application (origine locale) vers l'hôte
// factice : requêtes cross-origin (fetch de l'importeur par défaut, tuiles OSD en
// `crossOrigin=anonymous`). Sans CORS, tout échouerait silencieusement.
const CORS_HEADERS = { 'access-control-allow-origin': '*' };

/**
 * Sert les fixtures IIIF locales sur `iiif.e2e.test` :
 * - `/manifest.json` → manifest Presentation 2 (`e2e/fixtures/manifest.json`) ;
 * - `/image/info.json` → description Image API 2.0 « single-tile » ;
 * - `/image/{region}/{size}/{rotation}/{quality}.jpg` → l'image de test. Single-tile
 *   oblige, toute région/taille renvoie l'image entière (la tuile unique EST l'image) ;
 * - tout le reste sur cet hôte → 404, pour qu'une URL mal construite échoue bruyamment.
 */
export async function serveIiifFixtures(page: Page): Promise<void> {
  await page.route(IIIF_FIXTURE_PATTERN, (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === '/manifest.json') {
      return route.fulfill({
        contentType: 'application/json',
        headers: CORS_HEADERS,
        path: MANIFEST_FIXTURE,
      });
    }
    if (pathname === '/image/info.json') {
      return route.fulfill({
        contentType: 'application/json',
        headers: CORS_HEADERS,
        path: INFO_FIXTURE,
      });
    }
    if (pathname.startsWith('/image/') && pathname.endsWith('.jpg')) {
      return route.fulfill({
        contentType: 'image/jpeg',
        headers: CORS_HEADERS,
        path: IMAGE_FIXTURE,
      });
    }
    return route.fulfill({
      status: 404,
      contentType: 'text/plain; charset=utf-8',
      body: `Fixture inconnue : ${pathname} (voir e2e/helpers/fixtures.ts)`,
    });
  });
}
