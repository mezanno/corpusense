import { ContentResource } from '@iiif/presentation-3';
import { RootState } from '../store';

export const getCanvasForCanvas =
  (componentId: string) =>
  (state: RootState): ContentResource | undefined =>
    state.canvases.values[componentId];
