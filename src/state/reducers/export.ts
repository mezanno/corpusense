import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ExportState {
  lastExportContent: object | string | null;
  lastExportDate: Date | null;
  lastExportError: string;
  lastExportStatus: 'OK' | 'ERROR' | 'UNKNOWN' | 'IN_PROGRESS';
}

const initialState: ExportState = {
  lastExportContent: null,
  lastExportDate: null,
  lastExportError: '',
  lastExportStatus: 'UNKNOWN',
};

export const exportSlice = createSlice({
  name: 'export',
  initialState,
  reducers: {
    exportRequest: (_state, _action: PayloadAction<string>) => {},
    exportSuccess: (state, action: PayloadAction<object | string>) => {
      state.lastExportContent = action.payload;
      state.lastExportDate = new Date();
      state.lastExportStatus = 'OK';
    },
    exportMultipleCollectionsRequest: (_state, _action: PayloadAction<string[]>) => {},
    exportTextOfCollectionRequest: (_state, _action: PayloadAction<string>) => {},
    exportTextOfCanvasRequest: (
      _state,
      _action: PayloadAction<{ canvasId: string; collectionId: string }>,
    ) => {},
    exportError: (state, action: PayloadAction<string>) => {
      state.lastExportError = action.payload;
      state.lastExportStatus = 'ERROR';
    },
    resetAlert: (state) => {
      state.lastExportDate = null;
      state.lastExportStatus = 'UNKNOWN';
    },
  },
});

export const {
  exportRequest,
  exportSuccess,
  exportError,
  exportMultipleCollectionsRequest,
  exportTextOfCollectionRequest,
  exportTextOfCanvasRequest,
  resetAlert,
} = exportSlice.actions;
export default exportSlice.reducer;
