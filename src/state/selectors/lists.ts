import { RootState } from '../store';

export const getLists = (state: RootState) => state?.lists?.values ?? [];

export const getActiveList = (state: RootState) =>
  state.lists.values.find((elt) => elt.id === state.lists.activeListId);

export const getElemntsOfList = (listId: string) => (state: RootState) => {
  return state.lists.values.find((elt) => elt.id === listId)?.content ?? [];
};

export const getCanvasesOfList = (listId: string) => (state: RootState) => {
  const elementsIds = getElemntsOfList(listId)(state).map((elt) => elt.canvasId);
  return state.storedItems.items.filter((elt) => elementsIds.includes(elt.id));
};
