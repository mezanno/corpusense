import { Canvas } from '@iiif/presentation-3';
import { RootState } from '../store';

export const getCanvasForComponent =
  (componentId: string) =>
  (state: RootState): Canvas | undefined =>
    state.canvases.values[componentId];

export const isCanvasDisplayed = (
  state: RootState,
  canvasId: string,
  componentId: string,
): boolean => {
  const canvas = getCanvasForComponent(componentId)(state);
  return canvas?.id === canvasId;
};
