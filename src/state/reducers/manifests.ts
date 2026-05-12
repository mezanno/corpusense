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
  error: string | null;
}

export const manifestInitialState: ManifestState = {
  isLoading: false,
  loadedData: null,
  isLoaded: false,
  error: null,
};

const loadingState: Omit<ManifestState, 'historyDetails'> = {
  isLoading: true,
  loadedData: null,
  isLoaded: false,
  error: null,
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
      state.error = action.payload || 'Error loading manifest';
    },
    fetchManifestSuccess: (
      state,
      action: PayloadAction<{ content: Manifest; metadata: ItemMetadataAttribute[] }>,
    ) => {
      state.isLoading = false;
      state.isLoaded = true;
      state.loadedData = action.payload;

      // const details = extractManifestDetails(action.payload.content);
      // state.historyDetails = state.historyDetails.filter(
      //   (item) => item.id !== action.payload.content.id,
      // );
      // state.historyDetails.unshift({ id: action.payload.content.id, ...details });
    },
    saveMetadataRequest: (_state, _action: PayloadAction<SaveMetadataPayload>) => {},
    saveMetadataSuccess: (state, action: PayloadAction<SaveMetadataPayload>) => {
      if (state.loadedData === null) return;
      state.loadedData.metadata = action.payload.metadata;
    },
  },
});

export const {
  fecthManifestRequest,
  fetchManifestError,
  fetchManifestSuccess,
  saveMetadataRequest,
  saveMetadataSuccess,
} = manifestsSlice.actions;
export default manifestsSlice.reducer;
