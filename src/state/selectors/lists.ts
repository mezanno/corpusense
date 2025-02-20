import { RootState } from '../store';

export const getLists = (state: RootState) => state?.lists?.values ?? [];
