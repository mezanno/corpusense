import { History } from '@/data/models/History';
import { ItemMetadataAttribute } from '@/data/models/Metadata';
import { Manifest } from '@iiif/presentation-3';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ManifestState {
  isLoading: boolean;
  error: string | null;
  loadedData: {
    content: Manifest;
    metadata: ItemMetadataAttribute[];
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
      action: PayloadAction<{ content: Manifest; metadata: ItemMetadataAttribute[] }>,
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
    removeFromHistory: (_state, _action: PayloadAction<string>) => {},
    removeFromHistorySuccess: (state, action: PayloadAction<string>) => {
      state.history = state.history.filter((item) => item.url !== action.payload);
    },
    saveMetadaRequest: (_state, _action: PayloadAction<ItemMetadataAttribute[]>) => {},
    saveMetadaSuccess: (state, action: PayloadAction<ItemMetadataAttribute[]>) => {
      if (state.loadedData === null) return;
      state.loadedData.metadata = action.payload;
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
  removeFromHistory,
  removeFromHistorySuccess,
  historyUpdated,
  saveMetadaRequest,
  saveMetadaSuccess,
} = manifestsSlice.actions;
export default manifestsSlice.reducer;
