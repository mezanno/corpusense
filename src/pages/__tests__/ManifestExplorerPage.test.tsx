import { getPreloadedState } from '@/__tests__/preloadedState';
import { renderWithProviders } from '@/__tests__/utils';
import { ManifestPageProvider } from '@/components/reducers/ManifestPageContext';
import useSource from '@/hooks/data/sources/useSource';
import { RootState } from '@/state/store';
import { screen } from '@testing-library/react';
import { describe, expect, it, Mock, vi } from 'vitest';
import ManifestExplorerPage from '../ManifestExplorerPage';

vi.mock('@/hooks/data/sources/useSource');
vi.mock('@/hooks/data/manifests/useManifests');
vi.mock('@/hooks/data/convertedFiles/useConvertedFileIO', () => ({
  default: () => ({
    loadManifest: vi.fn(),
  }),
}));

describe('ManifestExplorerPage', () => {
  it("affiche Welcome quand aucun manifest n'est chargé et l'historique est vide", () => {
    (useSource as Mock).mockReturnValue({
      isLoading: false,
      sourceWithContent: undefined,
      manifest: undefined,
    });

    renderWithProviders(
      <ManifestPageProvider>
        <ManifestExplorerPage />
      </ManifestPageProvider>,
      { preloadedState: getPreloadedState() },
    );

    // The i18n test mock echoes translation keys; asserting the heading proves Welcome rendered
    expect(screen.getByRole('heading', { name: 'title' })).toBeInTheDocument();
  });

  it('affiche les détails et la galerie quand un manifest est chargé', () => {
    const preloadedState: RootState = getPreloadedState();
    const mockManifest = {
      '@context': 'http://iiif.io/api/presentation/3/context.json',
      id: 'manifest-1',
      type: 'Manifest',
      items: [{ id: 'canvas-1', type: 'Canvas' }],
    };
    const mockSource = {
      id: 'source-1',
      name: 'Source 1',
      content: { manifest: mockManifest },
    };

    (useSource as Mock).mockReturnValue({
      isLoading: false,
      sourceWithContent: mockSource,
      manifest: mockManifest,
    });

    renderWithProviders(
      <ManifestPageProvider>
        <ManifestExplorerPage />
      </ManifestPageProvider>,
      { preloadedState },
    );

    expect(screen.getByRole('region', { name: 'aria_label_manifest_details' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'aria_label_canvas_viewer' })).toBeInTheDocument();
  });

  it('affiche Loading quand isLoading est vrai', () => {
    const preloadedState: RootState = getPreloadedState();

    (useSource as Mock).mockReturnValue({
      isLoading: true,
      sourceWithContent: undefined,
      manifest: undefined,
    });

    renderWithProviders(
      <ManifestPageProvider>
        <ManifestExplorerPage />
      </ManifestPageProvider>,
      { preloadedState },
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });
});
