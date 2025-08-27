import { getPreloadedState } from '@/__tests__/preloadedState';
import { renderWithProviders } from '@/__tests__/utils';
import * as useManifest from '@/hooks/useManifest';
import { RootState } from '@/state/store';
import '@testing-library/jest-dom';
import { describe, it, vi } from 'vitest';
import Layout from '../Layout';

vi.mock('@/hooks/useManifest', async (original) => {
  const actual = await original<typeof useManifest>();
  return {
    ...actual,
    useManifest: vi.fn(() => ({
      data: null,
    })),
  };
});

describe('Layout', () => {
  it("LayoutSideBar affiche 2 liens lorsque l'historique contient 2 éléments", () => {
    const preloadedState: RootState = {
      ...getPreloadedState(),
      manifests: {
        ...getPreloadedState().manifests,
      },
    };

    const screen = renderWithProviders(<Layout />, { preloadedState });
    expect(
      screen.getByRole('navigation', { name: 'historique' }).querySelectorAll('div').length,
    ).toBe(2);
  });
});

describe('Layout', () => {
  it("LayoutSideBar n'affiche aucun lien lorsque l'historique n'en contient pas", () => {
    const screen = renderWithProviders(<Layout />, { preloadedState: getPreloadedState() });
    expect(
      screen.getByRole('navigation', { name: 'historique' }).querySelectorAll('div').length,
    ).toBe(0);
  });
});

describe('Layout', () => {
  it('LayoutSideBar affiche 1 collection ouverte', () => {
    const baseState = getPreloadedState();
    const preloadedState: RootState = {
      ...baseState,
      collections: {
        ...baseState.collections,
        openedCollections: ['id1'],
        values: [
          {
            id: 'id1',
            name: 'Collection 1',
            tags: [],
            contentSize: 0,
          },
        ],
      },
    };
    const screen = renderWithProviders(<Layout />, { preloadedState });

    expect(
      screen.getByRole('link', {
        name: 'Collection 1',
      }),
    ).toBeInTheDocument();
  });
});
