import image from '@/__tests__/image.json';
import { getPreloadedState } from '@/__tests__/preloadedState';
import { renderWithProviders } from '@/__tests__/utils';
import { RootState } from '@/state/store';
import { ContentResource } from '@iiif/presentation-3';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CanvasViewer from './CanvasViewer';

describe('CanvasViewer', () => {
  it('should render the CanvasViewer component if a canvas is present in the store', () => {
    const preloadedState: RootState = {
      ...getPreloadedState(),
      canvases: {
        values: { test: image as ContentResource },
      },
    };

    renderWithProviders(<CanvasViewer />, { preloadedState });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('canvas viewer')).toBeInTheDocument();
  });
  it('Nothing To show appears if no canvas is set', () => {
    renderWithProviders(<CanvasViewer />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
