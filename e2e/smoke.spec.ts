import { expect, test } from '@playwright/test';
import { installE2ENetwork } from './helpers/network';
import {
  CREATE_COLLECTION,
  EMPTY_COLLECTIONS,
  SIDEBAR_TOGGLE,
  WELCOME_TITLE,
} from './helpers/selectors';

// S0 — fumée (Q9) : la coquille, le routeur et la couche données (Dexie sur IndexedDB
// vierge) démarrent sans erreur bloquante, sans réseau externe.
// Les libellés FR centralisés dans `helpers/selectors.ts` : un scénario de traduction
// ne casse qu'un seul fichier (étape 2 du plan).

test.describe('smoke', () => {
  test.beforeEach(async ({ page }) => {
    await installE2ENetwork(page);
  });

  test('accueil : le message de bienvenue et la barre latérale sont reachable', async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    await page.goto('/');

    // Le titre vient du namespace `welcome`, chargé asynchronement par i18next-http-backend.
    await expect(page.getByRole('heading', { name: WELCOME_TITLE })).toBeVisible();
    await expect(page.getByRole('button', { name: SIDEBAR_TOGGLE })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('gestion des collections : la page se monte sur une base IndexedDB vierge', async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    await page.goto('/collections');

    await expect(page.getByRole('button', { name: CREATE_COLLECTION, exact: true })).toBeVisible();
    await expect(page.getByRole('alert')).toContainText(EMPTY_COLLECTIONS);

    expect(pageErrors).toEqual([]);
  });

  test('PWA : aucun service worker enregistré en mode e2e', async ({ page }) => {
    // `vite.config.ts` désactive vite-plugin-pwa en mode e2e (enabled: mode !== 'e2e') ;
    // ce test le vérifie à l'exécution — un SW actif court-circuiterait l'interception
    // réseau et rendrait les rechargements non déterministes (plan Q9 § 6).
    await page.goto('/');

    const registrations = await page.evaluate(() => navigator.serviceWorker.getRegistrations());
    expect(registrations).toHaveLength(0);
  });
});
