import { RootState } from '../store';

export const getCanvasById = (canvasId: string) => (state: RootState) =>
  state.storedItems.items.find((elt) => elt.id === canvasId)?.content;
