import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const getLists = (state: RootState) => state?.lists?.values ?? [];

export const getOpenedLists = (state: RootState) => state.lists?.openedLists ?? [];

export const getElemntsOfList = createSelector(
  [(state: RootState) => state.lists?.values ?? [], (_: RootState, listId: string) => listId],
  (values, listId) => values.find((elt) => elt.id === listId)?.content ?? [],
);

export const getCanvasesOfList = createSelector(
  [
    (state: RootState, listId: string) => getElemntsOfList(state, listId),
    (state: RootState) => state.storedItems?.items ?? [],
  ],
  (elements, items) => {
    const elementsIds = new Set(elements.map((elt) => elt.canvasId));
    return items.filter((elt) => elementsIds.has(elt.id));
  },
);
