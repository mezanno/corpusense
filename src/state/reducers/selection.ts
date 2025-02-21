import { selection } from '@/data/models/selection';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SelectionState = selection[];

const initialState: SelectionState = [];

export const selectionSlice = createSlice({
  name: 'selection',
  initialState: {
    canvases: initialState,
  },
  reducers: {
    setSelection: (state, action: PayloadAction<selection[]>) => {
      state.canvases = action.payload;
    },
    setSelectionStart: (state, action: PayloadAction<selection>) => {
      console.log('setSelectionStart', action.payload);

      //if there is an element lower to the new start, we set the start to the new start
      state.canvases = state.canvases.filter((el) => el.index > action.payload.index);

      //TODO ajouter les éléments entre le start et le end
      // const indexMax: number = state.canvases.reduce(
      //   (acc, el) => (el.index > acc ? el.index : acc),
      //   action.payload.index,
      // );
      // for (let i: number = action.payload; i <= indexMax; i++) {
      //   state.canvases.push(i);
      // }

      state.canvases.push(action.payload);
    },
    setSelectionEnd: (state, action: PayloadAction<selection>) => {
      //if there is an element upper to the new end, we set the end to the new end
      state.canvases = state.canvases.filter((el) => el.index < action.payload.index);

      //TODO ajouter les éléments entre le start et le end
      // const indexMin: number = state.canvases.reduce(
      //   (acc, el) => (el.index < acc ? el.index : acc),
      //   action.payload,
      // );

      //add all the elements between the start and the end
      // for (let i = indexMin; i <= action.payload.index; i++) {
      //   state.canvases.push(i);
      // }

      state.canvases.push(action.payload);
    },
  },
});

export const { setSelection, setSelectionStart, setSelectionEnd } = selectionSlice.actions;
export default selectionSlice.reducer;
