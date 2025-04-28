import { Annotation } from '@/data/models/Annotation';
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

const selectAnnotations = (state: RootState) => state.annotations.values ?? [];
const selectCanvasId = (_: RootState, canvasId: string) => canvasId;
const selectCollectionId = (_: RootState, _canvasId: string, collectionId: string) => collectionId;

const getAnnotations = createSelector(
  [selectAnnotations, selectCanvasId, selectCollectionId],
  (annotations, canvasId, collectionId): Annotation[] => {
    return annotations
      .filter((a) => a.canvasId === canvasId && a.collectionId === collectionId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },
);

export { getAnnotations };
