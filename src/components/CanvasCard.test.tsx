import canvas from '@/__tests__/canvas.json';
import { getPreloadedState } from '@/__tests__/preloadedState';
import { renderWithProviders } from '@/__tests__/utils';
import { RootState } from '@/state/store';
import { Canvas } from '@iiif/presentation-3';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CanvasCard from './CanvasCard';

describe('CanvasCard', () => {
  it('should render the CanvasCard with a white background (not selected)', () => {
    const preloadedState: RootState = {
      ...getPreloadedState(),
      selection: {
        ...getPreloadedState().selection,
        canvases: [
          {
            index: 0, //l'indice ici est différent de celui du canvas (not selected)
            canvas: canvas as Canvas,
          },
        ],
      },
      lists: {
        ...getPreloadedState().lists,
      },
    };

    const handleClick = vi.fn();

    renderWithProviders(
      <CanvasCard canvas={canvas as Canvas} index={143} onClick={handleClick} />,
      {
        preloadedState,
      },
    );

    //le numéro de page du canvas doit apparaître
    expect(screen.getByText('143')).toBeInTheDocument();
    //la miniature du canvas doit apparaître
    expect(screen.getByRole('img')).toBeInTheDocument();
    //le fond de la carte doit être blanc si elle n'est pas sélectionnée
    expect(screen.getByRole('listitem')).toHaveClass('bg-white');
  });

  it('should render the CanvasCard with a blue background (selected)', () => {
    const preloadedState: RootState = {
      ...getPreloadedState(),
      selection: {
        ...getPreloadedState().selection,
        canvases: [
          {
            index: 143,
            canvas: canvas as Canvas,
          },
        ],
      },
      lists: {
        ...getPreloadedState().lists,
      },
    };

    const handleClick = vi.fn();

    renderWithProviders(
      <CanvasCard canvas={canvas as Canvas} index={143} onClick={handleClick} />,
      {
        preloadedState,
      },
    );

    //le numéro de page du canvas doit apparaître
    expect(screen.getByText('143')).toBeInTheDocument();
    //la miniature du canvas doit apparaître
    expect(screen.getByRole('img')).toBeInTheDocument();
    //le fond de la carte doit être bleu si elle est sélectionnée
    expect(screen.getByRole('listitem')).toHaveClass('bg-blue-300');
  });
});
