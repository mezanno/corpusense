import { Event, EventType } from '@/data/models/Event';
import { History } from '@/data/models/History';
import { ItemMetadataAttribute } from '@/data/models/Metadata';
import { StoredManifestDetails } from '@/data/models/StoredManifest';
import { extractManifestDetails } from '@/data/utils/manifest';
import { Manifest } from '@iiif/presentation-3';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ManifestState {
  isLoading: boolean;
  loadedData: {
    content: Manifest;
    metadata: ItemMetadataAttribute[];
  } | null;
  isLoaded: boolean;
  historyDetails: StoredManifestDetails[];
  manifestOpenEvent: Event | undefined; // Optional event to track when the manifest is opened
}

export const manifestInitialState: ManifestState = {
  isLoading: false,
  loadedData: null,
  historyDetails: [],
  isLoaded: false,
  manifestOpenEvent: undefined, // Initialize the manifestOpenEvent to false
};

const loadingState: Omit<ManifestState, 'historyDetails'> = {
  isLoading: true,
  loadedData: null,
  isLoaded: false,
  manifestOpenEvent: undefined, // Reset the manifestOpenEvent when loading
};

const applyLoadingState = (state: ManifestState): ManifestState => ({
  ...state,
  ...loadingState,
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

      const details = extractManifestDetails(action.payload.content);
      state.historyDetails = state.historyDetails.filter(
        (item) => item.id !== action.payload.content.id,
      );
      state.historyDetails.unshift({ id: action.payload.content.id, ...details });
    },
    setHistory: (
      state,
      action: PayloadAction<{ history: History[]; manifestDetails: StoredManifestDetails[] }>,
    ) => {
      state.historyDetails = action.payload.manifestDetails;
    },
    removeFromHistoryRequest: (_state, _action: PayloadAction<string>) => {},
    removeFromHistorySuccess: (state, action: PayloadAction<string>) => {
      //action.payload is the manifest id to remove

      state.historyDetails = state.historyDetails.filter((item) => item.id !== action.payload);
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
  saveMetadataRequest,
  saveMetadataSuccess,
  resetManifestOpenEvent,
} = manifestsSlice.actions;
export default manifestsSlice.reducer;
