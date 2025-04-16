import { Canvas } from '@iiif/presentation-3';
import { RootState } from '../store';

export const getCanvasForComponent =
  (componentId: string) =>
  (state: RootState): Canvas | undefined =>
    state.canvases.values[componentId];
