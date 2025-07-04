import { Canvas } from '@iiif/presentation-3';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CanvasesState {
  values: { [key: string]: Canvas };
}
const initialState: CanvasesState = {
  values: {},
};

export interface SetCanvasFromComponentPayload {
  componentId: string;
  canvas: Canvas;
  collectionId?: string;
}

export const canvasesSlice = createSlice({
  name: 'canvases',
  initialState,
  reducers: {
    setCanvasFromComponent: (state, action: PayloadAction<SetCanvasFromComponentPayload>) => {
      const { componentId, canvas } = action.payload;
      state.values[componentId] = canvas;
    },
    reset: (state, action: PayloadAction<string>) => {
      //payload = componentId
      delete state.values[action.payload];
    },
  },
});

export const { setCanvasFromComponent, reset } = canvasesSlice.actions;
export default canvasesSlice.reducer;
