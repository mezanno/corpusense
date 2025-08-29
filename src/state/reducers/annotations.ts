import { Annotation } from '@/data/models/Annotation';
import { CanvasScope, Scope } from '@/data/models/Scope';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type AnnotationState = {
  currentScope?: Scope;
  values: Annotation[];
  isLoading: boolean;
  deleted: Annotation;
  updated: Annotation;
};

const initialState: AnnotationState = {
  currentScope: undefined,
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
    removeAnnotationsByScopeRequest(
      _state,
      _action: PayloadAction<{ scope: Scope; types?: string[] }>,
    ) {},
    removeAnnotationRequest(_state, _action: PayloadAction<string[]>) {},
    removeAnnotationSuccess(state, action: PayloadAction<string[]>) {
      // Remove multiple annotations by their IDs
      state.values = state.values.filter((a) => !action.payload.includes(a.id));
    },
    removeAllCollectionAnnotationsRequest(_state, _action: PayloadAction<string>) {}, //action.payload = collectionId
    removeAllCollectionAnnotationsSuccess(state, action: PayloadAction<string>) {
      // Remove all annotations for a specific collection
      state.values = state.values.filter((a) => a.collectionId !== action.payload);
    },
    removeAllCanvasAnnotationsRequest(
      _state,
      _action: PayloadAction<{ canvasId: string; collectionId: string }>,
    ) {},
    removeAllRegionAnnotationsRequest(_state, _action: PayloadAction<Annotation>) {},
    removeAllAnnotationsSuccess(state, action: PayloadAction<string[]>) {
      state.values = state.values.filter((a) => !action.payload.includes(a.id));
    },
    fetchAnnotationsRequest(_state, _action: PayloadAction<CanvasScope>) {},
    fetchAnnotationsSuccess(
      state,
      action: PayloadAction<{ scope: CanvasScope; annotations: Annotation[] }>,
    ) {
      state.isLoading = false;
      state.currentScope = action.payload.scope;
      state.values = action.payload.annotations;
    },
    addAnnotationsSuccess(state, action: PayloadAction<Annotation[]>) {
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
    duplicateAnnotationsToAllPagesRequest(
      _state,
      _action: PayloadAction<{ canvasId: string; collectionId: string }>,
    ) {},
    duplicateAnnotationsEach2PagesRequest(
      _state,
      _action: PayloadAction<{ canvasId: string; collectionId: string }>,
    ) {},
    recomputeRegionsRequest(_state, _action: PayloadAction<string>) {},
    syncWithDB(_state, _action: PayloadAction<{ canvasId: string; collectionId: string }>) {},
  },
});

export const {
  addAnnotationsSuccess,
  saveAnnotationRequest,
  saveAnnotationSuccess,
  removeAnnotationsByScopeRequest,
  removeAnnotationRequest,
  removeAnnotationSuccess,
  removeAllCollectionAnnotationsRequest,
  removeAllCollectionAnnotationsSuccess,
  removeAllCanvasAnnotationsRequest,
  removeAllAnnotationsSuccess,
  removeAllRegionAnnotationsRequest,
  fetchAnnotationsRequest,
  fetchAnnotationsSuccess,
  updateAnnotationOrderValueRequest,
  updateAnnotationOrderValueSuccess,
  duplicateAnnotationsToAllPagesRequest,
  duplicateAnnotationsEach2PagesRequest,
  recomputeRegionsRequest,
  syncWithDB,
} = annotationsSlice.actions;
export default annotationsSlice.reducer;
