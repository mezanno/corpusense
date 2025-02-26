import { History } from '@/data/models/history';
import { Manifest } from '@iiif/presentation-3';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ManifestState {
  isLoading: boolean;
  error: string | null;
  data: Manifest | null;
  history: History[];
}

const initialState: ManifestState = {
  isLoading: false,
  error: '',
  data: null,
  history: [],
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
    fetchManifestError: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    fetchManifestSuccess: (state, action: PayloadAction<Manifest>) => {
      console.log('fetchManifestSuccess', action.payload);
      const m: Manifest = action.payload;
      console.log(m.items);

      state.isLoading = false;
      state.data = action.payload;
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
  fetchManifestError,
  fetchManifestSuccess,
  setHistory,
  historyUpdated,
} = manifestsSlice.actions;
export default manifestsSlice.reducer;
