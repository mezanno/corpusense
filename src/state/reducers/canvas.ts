import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CanvasesState {
  values: { [key: string]: object };
}
const initialState: CanvasesState = {
  values: {},
};

export const canvasesSlice = createSlice({
  name: 'canvases',
  initialState,
  reducers: {
    setCanvasFromComponent: (
      state,
      action: PayloadAction<{ componentId: string; canvas: object }>,
    ) => {
      const { componentId, canvas } = action.payload;
      state.values[componentId] = canvas;
    },
  },
});

export const { setCanvasFromComponent } = canvasesSlice.actions;
export default canvasesSlice.reducer;
