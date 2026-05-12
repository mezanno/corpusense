import manifest from '@/__tests__/manifestWith3Canvas.json';
import { getPreloadedState } from '@/__tests__/preloadedState';
import { renderWithProviders } from '@/__tests__/utils';
import { useManifests } from '@/hooks/data/manifests/useManifests';
import { RootState } from '@/state/store';
import { Manifest } from '@iiif/presentation-3';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, Mock } from 'vitest';
import ManifestExplorerPage from '../ManifestExplorerPage';

vi.mock('@/hooks/data/manifests/useManifests');
vi.mock('@/hooks/data/convertedFiles/useConvertedFileIO', () => ({
  default: () => ({
    loadManifest: vi.fn(),
  }),
}));

describe('ManifestExplorerPage', () => {
  beforeEach(() => {
    (useManifests as Mock).mockReturnValue({
      historyDetails: [],
      removeFromHistory: vi.fn(),
    });
  });

  it("affiche Welcome quand aucun manifest n'est chargé et l'historique est vide", () => {
    renderWithProviders(<ManifestExplorerPage />, { preloadedState: getPreloadedState() });

    expect(screen.getByText(/Bienvenue sur Corpusense/)).toBeInTheDocument();
  });

  it('affiche les détails et la galerie quand un manifest est chargé', () => {
    const data = manifest as unknown as Manifest;
    const preloadedState: RootState = getPreloadedState({
      manifests: {
        isLoading: false,
        isLoaded: true,
        loadedData: { content: data, metadata: [] },
        error: null,
      },
    });

    renderWithProviders(<ManifestExplorerPage />, { preloadedState });

    expect(screen.getByRole('region', { name: 'manifest details' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'canvas viewer' })).toBeInTheDocument();
    expect(screen.getByTestId('clover-summary')).toHaveTextContent(/Almanach-Bottin/);
  });

  it('affiche Loading quand isLoading est vrai', () => {
    const preloadedState: RootState = getPreloadedState({
      manifests: {
        isLoading: true,
        isLoaded: false,
        loadedData: null,
        error: null,
      },
    });

    renderWithProviders(<ManifestExplorerPage />, { preloadedState });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });
});
