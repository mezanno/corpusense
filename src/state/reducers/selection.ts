import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SelectionState = number[];

const initialState: SelectionState = [];

export const selectionSlice = createSlice({
  name: 'selection',
  initialState: {
    canvases: initialState,
  },
  reducers: {
    setSelection: (state, action: PayloadAction<number[]>) => {
      state.canvases = action.payload;
    },
    setSelectionStart: (state, action: PayloadAction<number>) => {
      console.log('setSelectionStart', action.payload);

      //if there is an element lower to the new start, we set the start to the new start
      state.canvases = state.canvases.filter((el) => el > action.payload);

      const indexMax: number = state.canvases.reduce(
        (acc, el) => (el > acc ? el : acc),
        action.payload,
      );
      for (let i: number = action.payload; i <= indexMax; i++) {
        state.canvases.push(i);
      }

      state.canvases.push(action.payload);
    },
    setSelectionEnd: (state, action: PayloadAction<number>) => {
      //if there is an element upper to the new end, we set the end to the new end
      state.canvases = state.canvases.filter((el) => el < action.payload);

      const indexMin: number = state.canvases.reduce(
        (acc, el) => (el < acc ? el : acc),
        action.payload,
      );

      //add all the elements between the start and the end
      for (let i = indexMin; i <= action.payload; i++) {
        state.canvases.push(i);
      }

      state.canvases.push(action.payload);
    },
  },
});

export const { setSelection, setSelectionStart, setSelectionEnd } = selectionSlice.actions;
export default selectionSlice.reducer;
