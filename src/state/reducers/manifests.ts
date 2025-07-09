import { Event, EventType } from '@/data/models/Event';
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
  manifestOpenEvent: Event | undefined; // Optional event to track when the manifest is opened
}

export const manifestInitialState: ManifestState = {
  isLoading: false,
  loadedData: null,
  history: [],
  isLoaded: false,
  manifestOpenEvent: undefined, // Initialize the manifestOpenEvent to false
};

const loadingState: Omit<ManifestState, 'history'> = {
  isLoading: true,
  loadedData: null,
  isLoaded: false,
  manifestOpenEvent: undefined, // Reset the manifestOpenEvent when loading
};

const applyLoadingState = (state: ManifestState): ManifestState => ({
  ...loadingState,
  history: state.history,
});

export interface SaveMetadataPayload {
  manifestId: string;
  metadata: ItemMetadataAttribute[];
}

export const manifestsSlice = createSlice({
  name: 'manifests',
  initialState: manifestInitialState,
  reducers: {
    fecthManifestRequest: (state, _action: PayloadAction<string>) => applyLoadingState(state),
    fetchManifestError: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.manifestOpenEvent = {
        message: action.payload || 'Error loading manifest',
        type: EventType.ERROR,
      }; // Set the manifestOpenEvent to an error when loading fails
    },
    fetchManifestSuccess: (
      state,
      action: PayloadAction<{ content: Manifest; metadata: ItemMetadataAttribute[] }>,
    ) => {
      state.isLoading = false;
      state.isLoaded = true;
      state.loadedData = action.payload;
      state.manifestOpenEvent = { message: 'OK', type: EventType.INFO }; // Set the manifestOpenEvent when a manifest is successfully loaded
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
    resetManifestOpenEvent: (state) => {
      state.manifestOpenEvent = undefined; // Reset the manifestOpenEvent
    },
  },
});

export const {
  fecthManifestRequest,
  fetchManifestError,
  fetchManifestSuccess,
  setHistory,
  removeFromHistoryRequest,
  removeFromHistorySuccess,
  updateHistorySuccess,
  saveMetadataRequest,
  saveMetadataSuccess,
  resetManifestOpenEvent,
} = manifestsSlice.actions;
export default manifestsSlice.reducer;
