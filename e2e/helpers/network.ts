import type { Page } from '@playwright/test';
import { E2E_ORIGIN } from './config';
import { serveIiifFixtures } from './fixtures';

// Aucune sortie réseau externe pendant les tests E2E (Q9) : tout ce qui n'est pas
// servi par le serveur de dev e2e local est abandonné (Supabase factice, Gallica des
// liens d'exemple, fournisseurs IIIF réels…). Les fixtures IIIF sont servies par
// `serveIiifFixtures` sur l'hôte factice `iiif.e2e.test`. Les websockets HMR de Vite
// ne sont pas concernés par `page.route`.
// À appeler dans un `test.beforeEach`.
export async function blockExternalRequests(page: Page): Promise<void> {
  await page.route('**', (route) => {
    const url = route.request().url();
    if (url.startsWith(`${E2E_ORIGIN}/`)) {
      return route.continue();
    }
    return route.abort();
  });
}

/**
 * Harnais réseau complet d'un test : abort de toute sortie externe PUIS service des
 * fixtures IIIF sur l'hôte factice. L'ordre compte (Playwright donne la priorité à la
 * route enregistrée en dernier) ; c'est le point d'entrée unique des specs.
 */
export async function installE2ENetwork(page: Page): Promise<void> {
  await blockExternalRequests(page);
  await serveIiifFixtures(page);
}
