import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

const getAnnotations = createSelector(
  [
    (state: RootState) => state.annotations.values ?? [],
    (_: RootState, canvasId: string) => canvasId,
  ],
  (annotations, canvasId) =>
    annotations
      .filter((a) => a.canvasId === canvasId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
);

export { getAnnotations };
