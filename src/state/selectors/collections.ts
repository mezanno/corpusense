import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectCollections = (state: RootState) => state?.collections?.values ?? [];

export const selectCollectionById = createSelector(
  [
    (state: RootState) => state.collections?.values ?? [],
    (_: RootState, collectionId: string) => collectionId,
  ],
  (values, collectionId) => values.find((elt) => elt.id === collectionId),
);

export const selectCurrentCollection = (state: RootState) => state.collections?.currentCollection;

export const selectOpenedCollections = createSelector(
  [
    (state: RootState) => state.collections?.values ?? [],
    (state: RootState) => state.collections?.openedCollections ?? [],
  ],
  (values, openedCollections) =>
    values.filter((elt) => openedCollections.find((id) => id === elt.id) !== undefined),
);

export const selectLoadedCanvasById = (state: RootState, canvasId: string) =>
  state.collections?.loadedCanvases?.find((canvas) => canvas.id === canvasId);

export const selectModelIdOfCollection = createSelector(
  [
    (state: RootState) => state.collections?.values ?? [],
    (_: RootState, collectionId: string) => collectionId,
  ],
  (values, collectionId) => values.find((elt) => elt.id === collectionId)?.modelId,
);
