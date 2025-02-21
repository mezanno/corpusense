import { RootState } from '../store';

export const getCanvasForCanvas = (componentId: string) => (state: RootState) =>
  state.canvases.values[componentId];
