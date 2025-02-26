import { getPreloadedState } from '@/__tests__/preloadedState';
import { renderWithProviders } from '@/__tests__/utils';
import { RootState } from '@/state/store';
import { screen } from '@testing-library/dom';
import { expect } from 'vitest';
import Layout from './Layout';

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

    const { container } = renderWithProviders(<Layout />, { preloadedState });
    // console.log(prettyDOM(container));

    expect(screen.getByText('https://example.com/manifest1.json')).toBeInTheDocument();
    expect(screen.getByText('https://example.com/manifest2.json')).toBeInTheDocument();
  });
});
