import { getPreloadedState } from '@/__tests__/preloadedState';
import { Canvas } from '@iiif/presentation-3';
import { RootState } from '../../store';
import { getCanvasById } from '../storedItems';

const preloadedState = getPreloadedState();
const mockState: RootState = {
  ...preloadedState,
  storedItems: {
    ...preloadedState.storedItems,
    items: [
      { id: 'canvas1', content: { width: 800, height: 600 } as Canvas },
      { id: 'canvas2', content: { width: 1024, height: 768 } as Canvas },
    ],
  },
};

describe('getCanvasById selector', () => {
  it('should return the content of the canvas with the given ID', () => {
    const canvasId = 'canvas1';

    const result = getCanvasById(mockState, canvasId);

    expect(result).toEqual({ width: 800, height: 600 });
  });

  it('should return undefined if no canvas matches the given ID', () => {
    const canvasId = 'canvas3';

    const result = getCanvasById(mockState, canvasId);

    expect(result).toBeUndefined();
  });
});
