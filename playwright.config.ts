import { defineConfig, devices } from '@playwright/test';
import { E2E_ORIGIN, E2E_PORT } from './e2e/helpers/config';

// E2E Q9 (docs/developpement.md) — chromium seul : l'app ne cible que ce moteur en
// pratique (File System Access API). Les specs vivent dans `e2e/`, jamais en
// co-localisation (D-010 réserve `__tests__/` à Vitest).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: process.env.CI !== undefined,
  // retries en CI uniquement : un E2E doit être stable localement avant d'exister.
  retries: process.env.CI !== undefined ? 2 : 0,
  timeout: 30_000,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  use: {
    baseURL: E2E_ORIGIN,
    locale: 'fr',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Port dédié + strictPort : on ne réutilise jamais un serveur tiers (PWA active,
    // `.env` réel…); le serveur e2e est toujours celui lancé ici (HTTP, mode e2e).
    command: `npm run dev:e2e -- --port ${String(E2E_PORT)} --strictPort`,
    url: E2E_ORIGIN,
    timeout: 120_000,
  },
});
