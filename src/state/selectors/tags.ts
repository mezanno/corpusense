import { RootState } from '../store';

export const getTags = (state: RootState) => state.tags.values;
