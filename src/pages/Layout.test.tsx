import { getPreloadedState } from '@/__tests__/preloadedState';
import { renderWithProviders } from '@/__tests__/utils';
import * as useManifest from '@/hooks/useManifest';
import { RootState } from '@/state/store';
import { screen } from '@testing-library/dom';
import { expect, vi } from 'vitest';
import Layout from './Layout';

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
  it("AppSideBar affiche 2 liens lorsque l'historique contient 2 éléments", () => {
    const preloadedState: RootState = {
      ...getPreloadedState(),
      manifests: {
        ...getPreloadedState().manifests,
        history: [
          { url: 'https://example.com/manifest1.json' },
          { url: 'https://example.com/manifest2.json' },
        ],
      },
    };

    renderWithProviders(<Layout />, { preloadedState });

    expect(screen.getByRole('navigation', { name: 'historique' })).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'historique' }).querySelectorAll('div').length,
    ).toBe(2);
  });
});
