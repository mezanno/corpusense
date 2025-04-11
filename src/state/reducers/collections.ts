import { Collection } from '@/data/models/Collection';
import { SelectedCanvas } from '@/data/models/SelectedCanvas';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CollectionsState {
  values: Collection[];
  error: string;
  newCollectionEvent: boolean;
  openedCollections: Collection[];
}

const initialState: CollectionsState = {
  values: [],
  error: '',
  newCollectionEvent: false,
  openedCollections: [],
};

export const collectionsSlice = createSlice({
  name: 'collections',
  initialState,
  reducers: {
    addCollectionRequest: (state, _action: PayloadAction<string>) => {
      state.newCollectionEvent = false;
    },
    addCollectionSuccess: (state, action: PayloadAction<Collection>) => {
      state.values.push(action.payload);
      if (
        action.payload.id !== undefined &&
        state.openedCollections.find((elt) => elt.id === action.payload.id)
      ) {
        state.openedCollections.push(action.payload);
      }
      state.newCollectionEvent = true;
    },
    removeCollectionRequest: (_state, _action: PayloadAction<string>) => {},
    removeCollectionSuccess: (state, action: PayloadAction<string>) => {
      const collectionId: string = action.payload;
      state.values = state.values.filter((elt) => elt.id !== collectionId);
      state.openedCollections = state.openedCollections.filter((elt) => elt.id !== collectionId);
    },
    updateCollectionRequest: (_state, _action) => {},
    updateCollectionSuccess: (state, action: PayloadAction<Collection>) => {
      const collection: Collection | undefined = state.values.find(
        (elt) => elt.id === action.payload.id,
      );
      if (collection !== undefined) {
        collection.name = action.payload.name;
        collection.about = action.payload.about;
        collection.tags = action.payload.tags;
      }
    },
    setCollections: (state, action: PayloadAction<Collection[]>) => {
      state.values = action.payload;
    },
    addCollectionToHistory: (state, action: PayloadAction<string>) => {
      if (state.openedCollections.find((elt) => elt.id === action.payload) === undefined) {
        state.openedCollections.push(
          state.values.find((elt) => elt.id === action.payload) as Collection,
        );
      }
    },
    addSelectionToCollectionRequest: (
      _state,
      _action: PayloadAction<{
        selection: SelectedCanvas[];
        collectionId: string;
        manifestId: string;
      }>,
    ) => {},
    addSelectionToCollectionSuccess: (state, action: PayloadAction<Collection>) => {
      const collection: Collection | undefined = state.values.find(
        (elt) => elt.id === action.payload.id,
      );
      if (collection !== undefined) {
        collection.content = action.payload.content;
      }
    },
    createCollectionWithSelectionRequest: (
      _state,
      _action: PayloadAction<{ selection: SelectedCanvas[]; name: string; manifestId: string }>,
    ) => {},
    fetchCanvasesOfCollectionRequest: (_state, _action: PayloadAction<string>) => {},
    fetchCanvasesOfCollectionSuccess: (state, action: PayloadAction<Collection>) => {
      // const list: List = state.values.find((elt) => elt.id === action.payload.id);
      console.log(
        'fetchCanvasesOfCollectionSuccess: ',
        state.values.find((elt) => elt.id === action.payload.id),
      );
    },
    removeElementFromCollection: (
      _state,
      _action: PayloadAction<{ collectionId: string; canvasId: string }>,
    ) => {},
    removeElementFromCollectionSuccess: (state, action: PayloadAction<Collection>) => {
      const collection: Collection | undefined = state.values.find(
        (elt) => elt.id === action.payload.id,
      );
      if (collection && collection.content !== undefined) {
        collection.content = action.payload.content;
      }
    },
    removeFromOpenedCollections: (state, action: PayloadAction<string>) => {
      const collectionId: string = action.payload;
      state.openedCollections = state.openedCollections.filter((elt) => elt.id !== collectionId);
    },
    importOneCollection: (_state, _action: PayloadAction<object>) => {},
    importMultipleCollections: (_state, _action: PayloadAction<ArrayBuffer>) => {},
    reset: (state) => {
      state.newCollectionEvent = false;
    },
  },
});

export const {
  addCollectionRequest,
  addCollectionSuccess,
  removeCollectionSuccess,
  removeCollectionRequest,
  updateCollectionRequest,
  updateCollectionSuccess,
  setCollections,
  addCollectionToHistory,
  addSelectionToCollectionRequest,
  addSelectionToCollectionSuccess,
  createCollectionWithSelectionRequest,
  removeElementFromCollection,
  removeElementFromCollectionSuccess,
  removeFromOpenedCollections,
  // removeSelectionFromList,
  importOneCollection,
  importMultipleCollections,
  reset,
} = collectionsSlice.actions;
export default collectionsSlice.reducer;
