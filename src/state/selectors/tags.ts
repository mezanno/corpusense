import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectTags = (state: RootState) => state.tags.values;

export const selectTagsByIds = createSelector(
  [(state: RootState) => state.tags.values ?? [], (_: RootState, ids: string[]) => ids],
  (tags, ids) => ids?.map((id) => tags?.find((t) => t.id === id)).filter(Boolean) ?? [],
);
