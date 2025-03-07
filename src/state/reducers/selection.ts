import { SelectedCanvas } from '@/data/models/SelectedCanvas';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SelectionState = {
  canvases: SelectedCanvas[] | [];
  indexStart: number;
  indexEnd: number;
};

export const selectionSlice = createSlice({
  name: 'selection',
  initialState: {
    canvases: [] as SelectedCanvas[],
    indexStart: -1,
    indexEnd: -1,
  },
  reducers: {
    setSelection: (
      state,
      action: PayloadAction<{ selection: SelectedCanvas[]; start: number; end: number }>,
    ) => {
      state.canvases = action.payload.selection;
      state.indexStart = action.payload.start;
      state.indexEnd = action.payload.end;
    },
    setSelectionStartRequest: (_state, _action: PayloadAction<number>) => {},
    setSelectionEndRequest: (_state, _action: PayloadAction<number>) => {},
  },
});

export const { setSelection, setSelectionStartRequest, setSelectionEndRequest } =
  selectionSlice.actions;
export default selectionSlice.reducer;
