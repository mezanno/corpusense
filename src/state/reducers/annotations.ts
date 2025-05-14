import { Annotation } from '@/data/models/Annotation';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type AnnotationState = {
  values: Annotation[];
  error?: string;
  isLoading: boolean;
  deleted: Annotation;
  updated: Annotation;
};

const initialState: AnnotationState = {
  values: [],
  isLoading: false,
  deleted: {} as Annotation,
  updated: {} as Annotation,
};

const annotationsSlice = createSlice({
  name: 'annotations',
  initialState,
  reducers: {
    saveAnnotationRequest(_state, _action: PayloadAction<Annotation>) {},
    saveAnnotationSuccess(state, action: PayloadAction<Annotation>) {
      //if the annotation already exists in the store, update it
      if (state.values.find((a) => a.id === action.payload.id)) {
        state.values = state.values.map((a) => {
          if (a.id === action.payload.id) {
            return action.payload;
          }
          return a;
        });
      } else {
        //if the annotation does not exist, add it
        state.values.push(action.payload);
      }
    },
    removeAnnotationRequest(_state, _action: PayloadAction<string>) {},
    removeAnnotationSuccess(state, action: PayloadAction<string>) {
      state.values = state.values.filter((a) => a.id !== action.payload);
    },
    removeAllCollectionAnnotationsRequest(_state, _action: PayloadAction<string>) {}, //action.payload = collectionId
    removeAllCanvasAnnotationsRequest(
      _state,
      _action: PayloadAction<{ canvasId: string; collectionId: string }>,
    ) {},
    removeAllRegionAnnotationsRequest(_state, _action: PayloadAction<Annotation>) {},
    removeAllAnnotationsSuccess(state, action: PayloadAction<string[]>) {
      state.values = state.values.filter((a) => !action.payload.includes(a.id));
    },
    removeAllAnnotationsFailure(_state, _action) {
      // state.error = action.payload;
    },
    fetchAnnotationsByCanvasId(state, _action: PayloadAction<string>) {
      state.isLoading = true;
      state.values = [];
    },
    fetchAnnotationsSuccess(state, action: PayloadAction<Annotation[]>) {
      console.log('fetchAnnotationsSuccess: ', action);

      state.isLoading = false;

      state.values = [
        ...state.values,
        ...action.payload.filter(
          (item) => !state.values.some((existing) => existing.id === item.id),
        ),
      ];
    },
    updateAnnotationOrderValueRequest(
      _state,
      _action: PayloadAction<{ annotationId: string; value: number }>,
    ) {},
    updateAnnotationOrderValueSuccess(
      state,
      action: PayloadAction<{ annotationId: string; value: number }>,
    ) {
      const annotation = state.values.find((a) => a.id === action.payload.annotationId);
      if (annotation !== undefined) {
        annotation.order = action.payload.value;
      }
    },
    syncWithDB(_state, _action: PayloadAction<{ canvasId: string; collectionId: string }>) {},
  },
});

export const {
  saveAnnotationRequest,
  saveAnnotationSuccess,
  removeAnnotationRequest,
  removeAnnotationSuccess,
  removeAllCollectionAnnotationsRequest,
  removeAllCanvasAnnotationsRequest,
  removeAllAnnotationsFailure,
  removeAllAnnotationsSuccess,
  removeAllRegionAnnotationsRequest,
  fetchAnnotationsByCanvasId,
  fetchAnnotationsSuccess,
  updateAnnotationOrderValueRequest,
  updateAnnotationOrderValueSuccess,
  syncWithDB,
} = annotationsSlice.actions;
export default annotationsSlice.reducer;
