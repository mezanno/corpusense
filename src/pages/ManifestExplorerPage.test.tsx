import manifest from '@/__tests__/manifest.json';
import { getPreloadedState } from '@/__tests__/preloadedState';
import { renderWithProviders } from '@/__tests__/utils';
import { RootState } from '@/state/store';
import { Manifest } from '@iiif/presentation-3';
import { screen } from '@testing-library/react';
import { afterAll, describe, expect, it, vi } from 'vitest';
import ManifestExplorerPage from './ManifestExplorerPage';

describe('ManifestExplorerPage', () => {
  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("ManifestExplorerPage affiche juste la section manifest details si aucun manifest n'est chargé", () => {
    renderWithProviders(<ManifestExplorerPage />, { preloadedState: getPreloadedState() });

    expect(screen.getByRole('region', { name: 'manifest details' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'canvas gallery' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'canvas viewer' })).not.toBeInTheDocument();

    expect(screen.getByText('Nothing to show')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'historique' })).toBeInTheDocument();
  });

  it('ManifestExplorerPage affiche les sections détails et canvas gallery si un manifest est chargé', () => {
    const data = manifest as Manifest;
    const preloadedState: RootState = {
      ...getPreloadedState(),
      manifests: {
        ...getPreloadedState().manifests,
        data,
      },
    };

    renderWithProviders(<ManifestExplorerPage />, { preloadedState });

    expect(screen.getByRole('region', { name: 'manifest details' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'canvas gallery' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'canvas viewer' })).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Journal officiel de la République française. Lois et décrets',
    );
  });

  it("ManifestExplorerPage affiche un message d'erreur et l'historique si le manifest n'est pas valide", () => {
    const preloadedState: RootState = {
      ...getPreloadedState(),
      manifests: {
        ...getPreloadedState().manifests,
        error: 'Manifest invalide',
      },
    };

    renderWithProviders(<ManifestExplorerPage />, { preloadedState });
    expect(screen.getByRole('region', { name: 'manifest details' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'canvas gallery' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'canvas viewer' })).not.toBeInTheDocument();

    //one of the element with role alert should contain the text 'Manifest invalide'
    expect(
      screen
        .getAllByRole('alert')
        .some(
          (alert) => alert.textContent !== null && alert?.textContent.includes('Manifest invalide'),
        ),
    ).toBeTruthy();

    expect(screen.getByRole('navigation', { name: 'historique' })).toBeInTheDocument();
  });
});
