import { Collection } from '@/data/models/Collection';
import { SelectedCanvas } from '@/data/models/SelectedCanvas';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CollectionsState {
  values: Collection[];
  openedCollections: string[];
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
    createCollectionSuccess: (state, action: PayloadAction<Collection>) => {
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
    addCollectionToHistoryRequest: (state, action: PayloadAction<string>) => {
      if (state.openedCollections.find((id) => id === action.payload) === undefined) {
        state.openedCollections.push(action.payload);
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
    removeElementFromCollectionRequest: (
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
      state.openedCollections = state.openedCollections.filter((id) => id !== collectionId);
    },
    importOneCollectionRequest: (_state, _action: PayloadAction<object>) => {},
    importMultipleCollectionsRequest: (_state, _action: PayloadAction<ArrayBuffer>) => {},
  },
});

export const {
  createCollectionRequest,
  createCollectionSuccess,
  removeCollectionSuccess,
  removeCollectionRequest,
  updateCollectionRequest,
  updateCollectionSuccess,
  setCollections,
  addCollectionToHistoryRequest,
  addSelectionToCollectionRequest,
  addSelectionToCollectionSuccess,
  createCollectionWithSelectionRequest,
  removeElementFromCollectionRequest,
  removeElementFromCollectionSuccess,
  removeFromOpenedCollections,
  importOneCollectionRequest,
  importMultipleCollectionsRequest,
} = collectionsSlice.actions;
export default collectionsSlice.reducer;
