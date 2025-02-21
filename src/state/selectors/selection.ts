import { SelectedCanvas } from '@/data/models/selectedCanvas';
import { RootState } from '../store';

export const getSelection = (state: RootState): SelectedCanvas[] =>
  state?.selection?.canvases ?? [];

export const isSelected =
  (index: number, canvasId: string) =>
  (state: RootState): boolean => {
    return state.selection.canvases.some((el) => el.index == index && el.canvas.id == canvasId);
  };
