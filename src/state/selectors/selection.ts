import { RootState } from '../store';

export const getSelection = (state: RootState): number[] => state?.selection?.canvases ?? [];
