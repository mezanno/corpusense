import { SelectionState } from '../reducers/selection';

export const getSelection = (state: SelectionState): number[] => state?.selection?.canvases ?? [];
