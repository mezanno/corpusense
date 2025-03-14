import { Annotation } from '@/data/models/Annotation';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type AnnotationState = {
  values: Annotation[];
  error?: string;
  isLoading: boolean;
};

const initialState: AnnotationState = {
  values: [],
  isLoading: false,
};

const annotationsSlice = createSlice({
  name: 'annotations',
  initialState,
  reducers: {
    addAnnotationRequest(_state, _action: PayloadAction<Annotation>) {},
    addAnnotationSuccess(state, action: PayloadAction<Annotation>) {
      state.values.push(action.payload);
    },
    fetchAnnotationsByCanvasId(state, _action: PayloadAction<string>) {
      state.isLoading = true;
      state.values = [];
    },
    fetchAnnotationsSuccess(state, action: PayloadAction<Annotation[]>) {
      state.isLoading = false;
      state.values = action.payload;
    },
  },
});

export const {
  addAnnotationRequest,
  addAnnotationSuccess,
  fetchAnnotationsByCanvasId,
  fetchAnnotationsSuccess,
} = annotationsSlice.actions;
export default annotationsSlice.reducer;
