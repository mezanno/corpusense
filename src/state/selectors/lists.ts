import { RootState } from '../store';

export const getLists = (state: RootState) => state?.lists?.values ?? [];

export const getCanvasesOfList = (listId: string) => (state: RootState) => {
  const list = state.lists.values.find((elt) => elt.id === listId);
  return list?.content ?? [];
};
