import { History } from '@/data/models/History';
import { ItemMetadataAttribute } from '@/data/models/Metadata';
import { Manifest } from '@iiif/presentation-3';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ManifestState {
  isLoading: boolean;
  loadedData: {
    content: Manifest;
    metadata: ItemMetadataAttribute[];
  } | null;
  isLoaded: boolean;
  history: History[];
}

const initialState: ManifestState = {
  isLoading: false,
  loadedData: null,
  history: [],
  isLoaded: false,
};

const loadingState: Omit<ManifestState, 'history'> = {
  isLoading: true,
  loadedData: null,
  isLoaded: false,
};

const applyLoadingState = (state: ManifestState): ManifestState => ({
  ...loadingState,
  history: state.history,
});

export interface FetchManifestPayload {
  manifestId: string;
  forceV3?: boolean;
}

export interface SaveMetadataPayload {
  manifestId: string;
  metadata: ItemMetadataAttribute[];
}

export const manifestsSlice = createSlice({
  name: 'manifests',
  initialState,
  reducers: {
    fetchManifestFromUrlRequest: (state, _action: PayloadAction<FetchManifestPayload>) =>
      applyLoadingState(state),
    fetchManifestFromContentRequest: (state, _action: PayloadAction<string>) =>
      applyLoadingState(state),
    fetchManifestFromArkRequest: (state, _action: PayloadAction<string>) =>
      applyLoadingState(state),
    fetchManifestError: (state) => {
      state.isLoading = false;
    },
    fetchManifestSuccess: (
      state,
      action: PayloadAction<{ content: Manifest; metadata: ItemMetadataAttribute[] }>,
    ) => {
      state.isLoading = false;
      state.isLoaded = true;
      state.loadedData = action.payload;
    },
    updateHistorySuccess: (state, action: PayloadAction<History>) => {
      //add the manifest id to the history and remove the duplicates
      state.history = state.history.filter((item) => item.url !== action.payload.url);
      state.history.unshift(action.payload);
    },
    setHistory: (state, action: PayloadAction<History[]>) => {
      state.history = action.payload;
    },
    removeFromHistoryRequest: (_state, _action: PayloadAction<string>) => {},
    removeFromHistorySuccess: (state, action: PayloadAction<string>) => {
      state.history = state.history.filter((item) => item.url !== action.payload);
    },
    saveMetadataRequest: (_state, _action: PayloadAction<SaveMetadataPayload>) => {},
    saveMetadataSuccess: (state, action: PayloadAction<SaveMetadataPayload>) => {
      if (state.loadedData === null) return;
      state.loadedData.metadata = action.payload.metadata;
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
  removeFromHistoryRequest,
  removeFromHistorySuccess,
  updateHistorySuccess,
  saveMetadataRequest,
  saveMetadataSuccess,
} = manifestsSlice.actions;
export default manifestsSlice.reducer;
