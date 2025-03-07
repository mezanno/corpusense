import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ExportState {
  lastExportContent: object;
  lastExportDate: Date | null;
  lastExportError: string;
  lastExportStatus: 'OK' | 'ERROR' | 'UNKNOWN' | 'IN_PROGRESS';
}

const initialState: ExportState = {
  lastExportContent: {},
  lastExportDate: null,
  lastExportError: '',
  lastExportStatus: 'UNKNOWN',
};

export const exportSlice = createSlice({
  name: 'export',
  initialState,
  reducers: {
    exportRequest: (_state, _action: PayloadAction<string>) => {},
    exportSuccess: (state, action: PayloadAction<object>) => {
      state.lastExportContent = action.payload;
      state.lastExportDate = new Date();
      state.lastExportStatus = 'OK';
    },
    exportError: (state, action: PayloadAction<string>) => {
      state.lastExportError = action.payload;
      state.lastExportStatus = 'ERROR';
    },
  },
});

export const { exportRequest, exportSuccess, exportError } = exportSlice.actions;
export default exportSlice.reducer;
