import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

const getAnnotations = createSelector(
  [
    (state: RootState) => state.annotations.values ?? [],
    (_: RootState, canvasId: string) => canvasId,
  ],
  (annotations, canvasId) => annotations.filter((a) => a.canvasId === canvasId),
);

export { getAnnotations };
