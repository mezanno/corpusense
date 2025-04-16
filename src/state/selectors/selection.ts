import { SelectedCanvas } from '@/data/models/SelectedCanvas';
import { RootState } from '../store';

/**
 *
 * @returns The selected canvases
 */
export const getSelection = (state: RootState): SelectedCanvas[] =>
  state?.selection?.canvases ?? [];

/**
 * Indicates if a canvas is selected or not. It is used in the Canvas component to highlight the selected canvases.
 * @param index
 * @param canvasId
 * @returns
 */
export const isSelected =
  (index: number, canvasId: string) =>
  (state: RootState): boolean => {
    return state.selection.canvases.some((el) => el.index == index && el.canvas.id == canvasId);
  };

/**
 * Selector used to get the index of the last selected canvas. It is used in sagas.
 * @returns The index of the last selected canvas
 */
export const getSelectionEnd = (state: RootState): number => state.selection.indexEnd;

/**
 * Selector used to get the index of the first selected canvas. It is used in sagas.
 * @returns The index of the first selected canvas
 */
export const getSelectionStart = (state: RootState): number => state.selection.indexStart;
