import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const getCanvasById = createSelector(
  [(state: RootState) => state.storedItems.items, (_: RootState, canvasId: string) => canvasId],
  (items, canvasId) => items.find((elt) => elt.id === canvasId)?.content,
);
