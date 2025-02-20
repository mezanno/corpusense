import { ManifestNormalized } from '@iiif/presentation-3-normalized';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ManifestState {
  isLoading: boolean;
  error: string | null;
  data: ManifestNormalized | null;
  history: string[];
}

const initialState: ManifestState = {
  isLoading: false,
  error: '',
  data: null,
  history: [],
};

export const manifestsSlice = createSlice({
  name: 'viewer',
  initialState,
  reducers: {
    fetchManifest: (state, _action: PayloadAction<string>) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchManifestError: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    fetchManifestSuccess: (state, action: PayloadAction<ManifestNormalized>) => {
      state.isLoading = false;
      state.data = action.payload;
      //add the manifest id to the history and remove the duplicates
      state.history = state.history.filter((id) => id !== action.payload.id);
      state.history.unshift(action.payload.id);
    },
  },
});

export const { fetchManifest, fetchManifestError, fetchManifestSuccess } = manifestsSlice.actions;
export default manifestsSlice.reducer;
