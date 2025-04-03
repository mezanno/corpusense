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
      state.values.push(action.payload);
    },
    removeAnnotationRequest(_state, _action: PayloadAction<string>) {},
    removeAnnotationSuccess(state, action: PayloadAction<string>) {
      console.log('removeAnnotationSuccess ', action.payload);

      state.values = state.values.filter((a) => a.id !== action.payload);
    },
    fetchAnnotationsByCanvasId(state, _action: PayloadAction<string>) {
      state.isLoading = true;
      state.values = [];
    },
    fetchAnnotationsSuccess(state, action: PayloadAction<Annotation[]>) {
      console.log('fetchAnnotationsSuccess: ', action);

      state.isLoading = false;
      state.values = [...state.values, ...action.payload];
    },
    addLinkBetweenAnnotationsRequest(
      _state,
      _action: PayloadAction<{ source: string; target: string }>,
    ) {},
    addLinkBetweenAnnotationsSuccess(
      state,
      action: PayloadAction<{ source: string; target: string }>,
    ) {
      const fromAnnotation = state.values.find((a) => a.id === action.payload.source);
      const toAnnotation = state.values.find((a) => a.id === action.payload.target);
      if (fromAnnotation && toAnnotation) {
        fromAnnotation.next = action.payload.target;
        toAnnotation.previous = action.payload.source;
      }
    },
    removeLinkBetweenAnnotationsRequest(
      _state,
      _action: PayloadAction<{ source: string; target: string }>,
    ) {},
    removeLinkBetweenAnnotationsSuccess(
      state,
      action: PayloadAction<{ source: string; target: string }>,
    ) {
      const fromAnnotation = state.values.find((a) => a.id === action.payload.source);
      const toAnnotation = state.values.find((a) => a.id === action.payload.target);
      if (fromAnnotation && toAnnotation) {
        fromAnnotation.next = undefined;
        toAnnotation.previous = undefined;
      }
    },
    updateAnnotationValueRequest(_state, _action: PayloadAction<{ id: string; value: string }>) {},
    updateAnnotationValueSuccess(state, action: PayloadAction<{ id: string; value: string }>) {
      const annotation = state.values.find((a) => a.id === action.payload.id);
      if (annotation) {
        const body = {
          purpose: 'tagging',
          value: action.payload.value,
          id: annotation.id + '-t',
          annotation: annotation.id,
        };
        if (annotation.bodies[0].purpose === 'classifying') {
          annotation.bodies[1] = body;
        } else {
          annotation.bodies[0] = body;
        }
      }
    },
    linkAnnotationsFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    syncWithDB(_state, _action: PayloadAction<string>) {},
  },
});

export const {
  saveAnnotationRequest,
  saveAnnotationSuccess,
  removeAnnotationRequest,
  removeAnnotationSuccess,
  fetchAnnotationsByCanvasId,
  fetchAnnotationsSuccess,
  addLinkBetweenAnnotationsRequest,
  addLinkBetweenAnnotationsSuccess,
  removeLinkBetweenAnnotationsRequest,
  removeLinkBetweenAnnotationsSuccess,
  updateAnnotationValueRequest,
  updateAnnotationValueSuccess,
  linkAnnotationsFailure,
  syncWithDB,
} = annotationsSlice.actions;
export default annotationsSlice.reducer;
