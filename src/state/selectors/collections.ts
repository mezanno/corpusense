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

export const getOpenedCollections = createSelector(
  [
    (state: RootState) => state.collections?.values ?? [],
    (state: RootState) => state.collections?.openedCollections ?? [],
  ],
  (values, openedCollections) =>
    values.filter((elt) => openedCollections.find((id) => id === elt.id) !== undefined),
);

export const getElemntsOfCollection = createSelector(
  [
    (state: RootState) => state.collections?.values ?? [],
    (_: RootState, collectionId: string) => collectionId,
  ],
  (values, collectionId) => values.find((elt) => elt.id === collectionId)?.content ?? [],
);

export const getCanvasesOfCollection = createSelector(
  [
    (state: RootState, collectionId: string) => getElemntsOfCollection(state, collectionId),
    (state: RootState) => state.storedItems?.items ?? [],
  ],
  (elements, items) => {
    const elementsIds = new Set(elements.map((elt) => elt.canvasId));
    return items.filter((elt) => elementsIds.has(elt.id));
  },
);
