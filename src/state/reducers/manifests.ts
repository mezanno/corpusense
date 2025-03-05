import { History } from '@/data/models/History';
import { ItemMetadata } from '@/data/models/Metadata';
import { Manifest } from '@iiif/presentation-3';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ManifestState {
  isLoading: boolean;
  error: string | null;
  loadedData: {
    content: Manifest;
    metadata: ItemMetadata[];
  } | null;
  isLoaded: boolean;
  history: History[];
}

const initialState: ManifestState = {
  isLoading: false,
  error: '',
  loadedData: null,
  history: [],
  isLoaded: false,
};

export const manifestsSlice = createSlice({
  name: 'manifests',
  initialState,
  reducers: {
    fetchManifestFromUrlRequest: (state, _action: PayloadAction<string>) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchManifestFromContentRequest: (state, _action: PayloadAction<string>) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchManifestFromArkRequest: (state, _action: PayloadAction<string>) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchManifestError: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    fetchManifestSuccess: (
      state,
      action: PayloadAction<{ content: Manifest; metadata: ItemMetadata[] }>,
    ) => {
      state.isLoading = false;
      state.isLoaded = true;
      state.loadedData = action.payload;
    },
    historyUpdated: (state, action: PayloadAction<History>) => {
      //add the manifest id to the history and remove the duplicates
      // state.history = state.history.filter((id) => id !== action.payload.id);
      state.history.unshift(action.payload);
    },
    setHistory: (state, action: PayloadAction<History[]>) => {
      state.history = action.payload;
    },
  },
});

export const {
  fetchManifestFromUrlRequest,
  fetchManifestFromContentRequest,
  fetchManifestFromArkRequest,
  fetchManifestError,
  fetchManifestSuccess,
  setHistory,
  historyUpdated,
} = manifestsSlice.actions;
export default manifestsSlice.reducer;
