import { Annotation, AnnotationDTO, ElementType } from '@/data/models/Annotation';
import { CanvasScope, Scope } from '@/data/models/Scope';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type AnnotationState = {
  currentScope?: CanvasScope;
  values: Annotation[];
  isLoading: boolean;
};

const initialState: AnnotationState = {
  currentScope: undefined,
  values: [],
  isLoading: false,
};

const annotationsSlice = createSlice({
  name: 'annotations',
  initialState,
  reducers: {
    saveAnnotationRequest(_state, _action: PayloadAction<Annotation | AnnotationDTO>) {},
    updateAnnotationRequest(_state, _action: PayloadAction<Annotation>) {},
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
    //removeAnnotationsByScopeRequest : used to remove all annotations of a given scope (canvas, collection or 1 specific annotation)
    removeAnnotationsByScopeRequest(
      _state,
      _action: PayloadAction<{ scope: Scope; types?: ElementType[] }>,
    ) {},
    //removeAnnotationsRequest : remove multiple annotations by their IDs
    removeAnnotationsRequest(_state, _action: PayloadAction<string[]>) {},
    //removeAllAnnotationsInsideRequest : remove all annotations inside a specific annotation
    removeAllAnnotationsInsideRequest(_state, _action: PayloadAction<Annotation>) {},
    removeAnnotationsSuccess(state, action: PayloadAction<string[]>) {
      state.values = state.values.filter((a) => !action.payload.includes(a.id));
    },

    fetchAnnotationsRequest(state, _action: PayloadAction<CanvasScope>) {
      state.isLoading = true;
      state.currentScope = undefined;
      state.values = [];
    },
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
          (item) =>
            item.collectionId === state.currentScope?.collectionId &&
            item.canvasId === state.currentScope?.canvasId &&
            !state.values.some((existing) => existing.id === item.id),
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
  },
});

export const {
  addAnnotationsSuccess,
  saveAnnotationRequest,
  updateAnnotationRequest,
  saveAnnotationSuccess,
  removeAnnotationsByScopeRequest,
  removeAnnotationsRequest,
  removeAnnotationsSuccess,
  removeAllAnnotationsInsideRequest,
  fetchAnnotationsRequest,
  fetchAnnotationsSuccess,
  updateAnnotationOrderValueRequest,
  updateAnnotationOrderValueSuccess,
  duplicateAnnotationsToAllPagesRequest,
  duplicateAnnotationsEach2PagesRequest,
  recomputeRegionsRequest,
} = annotationsSlice.actions;
export default annotationsSlice.reducer;
