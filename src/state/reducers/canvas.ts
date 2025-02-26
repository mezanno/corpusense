import { ContentResource } from '@iiif/presentation-3';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CanvasesState {
  values: { [key: string]: ContentResource };
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
      action: PayloadAction<{ componentId: string; canvas: ContentResource }>,
    ) => {
      const { componentId, canvas } = action.payload;
      state.values[componentId] = canvas;
    },
    reset: (state) => {
      console.log('reset canvases');

      state.values = {};
    },
  },
});

export const { setCanvasFromComponent, reset } = canvasesSlice.actions;
export default canvasesSlice.reducer;
