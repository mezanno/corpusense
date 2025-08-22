import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const getCollections = (state: RootState) => state?.collections?.values ?? [];

export const getCollectionById = createSelector(
  [
    (state: RootState) => state.collections?.values ?? [],
    (_: RootState, collectionId: string) => collectionId,
  ],
  (values, collectionId) => values.find((elt) => elt.id === collectionId),
);

export const getCurrentCollection = (state: RootState) => state.collections?.currentCollection;

export const getOpenedCollections = createSelector(
  [
    (state: RootState) => state.collections?.values ?? [],
    (state: RootState) => state.collections?.openedCollections ?? [],
  ],
  (values, openedCollections) =>
    values.filter((elt) => openedCollections.find((id) => id === elt.id) !== undefined),
);

export const getLoadedCanvasById = (state: RootState, canvasId: string) =>
  state.collections?.loadedCanvases?.find((canvas) => canvas.id === canvasId);

export const getModelIdOfCollection = createSelector(
  [
    (state: RootState) => state.collections?.values ?? [],
    (_: RootState, collectionId: string) => collectionId,
  ],
  (values, collectionId) => values.find((elt) => elt.id === collectionId)?.modelId,
);
