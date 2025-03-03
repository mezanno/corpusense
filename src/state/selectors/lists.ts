import { RootState } from '../store';

export const getLists = (state: RootState) => state?.lists?.values ?? [];

export const getElemntsOfList = (listId: string) => (state: RootState) => {
  return state.lists.values.find((elt) => elt.id === listId)?.content ?? [];
};

export const getCanvasesOfList = (listId: string) => (state: RootState) => {
  const elementsIds = getElemntsOfList(listId)(state).map((elt) => elt.canvasId);
  return state.storedElements.values.filter((elt) => elementsIds.includes(elt.id));
};
