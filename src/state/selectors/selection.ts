import { selection } from '@/data/models/selection';
import { RootState } from '../store';

export const getSelection = (state: RootState): selection[] => state?.selection?.canvases ?? [];

export const isSelected =
  (index: number, canvasId: string) =>
  (state: RootState): boolean => {
    return state.selection.canvases.some((el) => el.index == index && el.canvasId == canvasId);
  };
