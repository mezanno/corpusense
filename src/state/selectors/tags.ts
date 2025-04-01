import { RootState } from '../store';

export const getTags = (state: RootState) => state.tags.values;

export const getTagsByIds = (ids: string[]) => (state: RootState) =>
  ids?.map((id) => state.tags.values.find((t) => t.id === id)).filter(Boolean) ?? [];
