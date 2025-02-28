import manifest from '@/__tests__/manifest.json';
import { getPreloadedState } from '@/__tests__/preloadedState';
import { renderWithProviders } from '@/__tests__/utils';
import { RootState } from '@/state/store';
import { Manifest } from '@iiif/presentation-3';
import { screen, waitFor } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import CanvasGallery from './CanvasGallery';

describe('CanvasGallery', () => {
  /*
  originalOffsetHeight et originalOffsetWidth sont nécessaire pour que la grille de la gallerie soit testable
  Il faut que les nouvelles valeurs soient assez grande pour que toutes les cartes soient affichées
  */
  const originalOffsetHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'offsetHeight',
  );
  const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 1000,
    });
  });

  afterAll(() => {
    if (originalOffsetHeight) {
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
    }
    if (originalOffsetWidth) {
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
    }
  });

  it('La gallerie affiche les cartes des canvas dans une grille ', async () => {
    const data = manifest as Manifest;
    const preloadedState: RootState = {
      ...getPreloadedState(),
      manifests: {
        ...getPreloadedState().manifests,
        data,
      },
    };

    const nbOfItems = data.items.length;

    renderWithProviders(<CanvasGallery />, { preloadedState });

    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(nbOfItems);
    });
  });

  it('La gallerie indique que le chargement est en cours si le manifest est en cours de chargement ', () => {
    const preloadedState: RootState = {
      ...getPreloadedState(),
      manifests: {
        ...getPreloadedState().manifests,
        isLoading: true,
      },
    };

    renderWithProviders(<CanvasGallery />, { preloadedState });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });
});
