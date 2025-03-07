import { SelectedCanvas } from '@/data/models/SelectedCanvas';
import { RootState } from '../store';

export const getSelection = (state: RootState): SelectedCanvas[] =>
  state?.selection?.canvases ?? [];

export const isSelected =
  (index: number, canvasId: string) =>
  (state: RootState): boolean => {
    return state.selection.canvases.some((el) => el.index == index && el.canvas.id == canvasId);
  };

export const getSelectionEnd = (state: RootState): number => state.selection.indexEnd;
export const getSelectionStart = (state: RootState): number => state.selection.indexStart;
