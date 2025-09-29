import { Annotation, ElementType, getAnnotationType } from '@/data/models/Annotation';
import { Collection, CollectionDetails } from '@/data/models/Collection';
import { Canvas } from '@iiif/presentation-3';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CollectionsState {
  values: CollectionDetails[]; // List of all collections to show in the collection list
  openedCollections: string[];
  currentCollection?: Collection; //the collection currently being viewed in the collection inspector
  loadedCanvases?: Canvas[]; //the canvases loaded for the current collection
  canvasHasOcrAnnotations?: { [canvasId: string]: boolean }; //dictionary of canvas id -> hasOcrAnnotations
}

const initialState: CollectionsState = {
  values: [],
  openedCollections: [],
};

export const collectionsSlice = createSlice({
  name: 'collections',
  initialState,
  reducers: {
    createCollectionRequest: (_state, _action: PayloadAction<string>) => {},
    createCollectionSuccess: (state, action: PayloadAction<CollectionDetails>) => {
      state.values.push(action.payload);
      if (
        action.payload.id !== undefined &&
        state.openedCollections.find((id) => id === action.payload.id) != null
      ) {
        state.openedCollections.push(action.payload.id);
      }
    },
    removeCollectionRequest: (_state, _action: PayloadAction<string>) => {},
    removeCollectionSuccess: (state, action: PayloadAction<string>) => {
      const collectionId: string = action.payload;
      state.values = state.values.filter((elt) => elt.id !== collectionId);
      state.openedCollections = state.openedCollections.filter((id) => id !== collectionId);
    },
    updateCollectionRequest: (_state, _action) => {},
    updateCollectionSuccess: (state, action: PayloadAction<CollectionDetails>) => {
      const collection: CollectionDetails | undefined = state.values.find(
        (elt) => elt.id === action.payload.id,
      );
      if (collection !== undefined) {
        collection.name = action.payload.name;
        collection.about = action.payload.about;
        collection.tags = action.payload.tags;
        collection.modelId = action.payload.modelId;
        collection.offline = action.payload.offline;
      }
    },
    loadCollectionRequest: (_state, _action: PayloadAction<string>) => {},
    loadCollectionSuccess: (
      state,
      action: PayloadAction<{
        collection: Collection;
        canvases: Canvas[];
        canvasHasOcrAnnotations: { [canvasId: string]: boolean };
      }>,
    ) => {
      const { collection, canvases, canvasHasOcrAnnotations } = action.payload;
      state.currentCollection = collection;
      if (state.openedCollections.find((id) => id === collection.id) === undefined) {
        state.openedCollections.push(collection.id);
      }
      state.loadedCanvases = canvases;
      state.canvasHasOcrAnnotations = canvasHasOcrAnnotations;
    },
    setCollections: (state, action: PayloadAction<CollectionDetails[]>) => {
      state.values = action.payload;
    },
    addSelectionToCollectionRequest: (
      _state,
      _action: PayloadAction<{
        selection: Canvas[];
        collectionId: string;
        manifestId: string;
      }>,
    ) => {},
    addSelectionToCollectionSuccess: (state, action: PayloadAction<Collection>) => {
      const { content, ...collectionDetails } = action.payload;
      state.currentCollection = action.payload;
      state.values = state.values.map((details) =>
        details.id === collectionDetails.id ? collectionDetails : details,
      );
    },
    createCollectionWithSelectionRequest: (
      _state,
      _action: PayloadAction<{ selection: Canvas[]; name: string; manifestId: string }>,
    ) => {},
    fetchCanvasesOfCollectionRequest: (_state, _action: PayloadAction<string>) => {},
    fetchCanvasesOfCollectionSuccess: (state, action: PayloadAction<Collection>) => {
      // const list: List = state.values.find((elt) => elt.id === action.payload.id);
      console.log(
        'fetchCanvasesOfCollectionSuccess: ',
        state.values.find((elt) => elt.id === action.payload.id),
      );
    },
    removeElementFromCollectionRequest: (
      _state,
      _action: PayloadAction<{ collectionId: string; canvasId: string }>,
    ) => {},
    removeElementFromCollectionSuccess: (state, _action: PayloadAction<Collection>) => {
      state.currentCollection = _action.payload;
    },
    removeFromOpenedCollections: (state, action: PayloadAction<string>) => {
      const collectionId: string = action.payload;
      state.openedCollections = state.openedCollections.filter((id) => id !== collectionId);
    },
    importCollectionRequest: (_state, _action: PayloadAction<object>) => {},
    importCollectionsRequest: (_state, _action: PayloadAction<ArrayBuffer>) => {},
    updateOcrStatus: (state, action: PayloadAction<Annotation[]>) => {
      action.payload.forEach((annotation) => {
        if (
          annotation.collectionId === state.currentCollection?.id &&
          state.canvasHasOcrAnnotations?.[annotation.canvasId] !== undefined &&
          getAnnotationType(annotation) === ElementType.LINE
        ) {
          state.canvasHasOcrAnnotations = {
            ...state.canvasHasOcrAnnotations,
            [annotation.canvasId]: true,
          };
        }
      });
    },
    toggleCollectionOfflineRequest: (
      _state,
      _action: PayloadAction<string>, // collectionId
    ) => {},
  },
});

export const {
  createCollectionRequest,
  createCollectionSuccess,
  removeCollectionSuccess,
  removeCollectionRequest,
  updateCollectionRequest,
  updateCollectionSuccess,
  loadCollectionRequest,
  loadCollectionSuccess,
  setCollections,
  addSelectionToCollectionRequest,
  addSelectionToCollectionSuccess,
  createCollectionWithSelectionRequest,
  removeElementFromCollectionRequest,
  removeElementFromCollectionSuccess,
  removeFromOpenedCollections,
  importCollectionRequest,
  importCollectionsRequest,
  updateOcrStatus,
  toggleCollectionOfflineRequest,
} = collectionsSlice.actions;
export default collectionsSlice.reducer;
