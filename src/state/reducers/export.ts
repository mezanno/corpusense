import { Annotation } from '@/data/models/Annotation';
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
    exportCollectionsRequest: (_state, _action: PayloadAction<string[]>) => {},
    exportTextOfCollectionRequest: (_state, _action: PayloadAction<string>) => {}, //paylad = collectionId
    exportTextOfCanvasRequest: (
      _state,
      _action: PayloadAction<{ canvasId: string; collectionId: string }>,
    ) => {},
    exportTextOfAnnotationRequest: (_state, _action: PayloadAction<Annotation>) => {},
  },
});

export const {
  exportRequest,
  exportSuccess,
  exportCollectionsRequest,
  exportTextOfCollectionRequest,
  exportTextOfCanvasRequest,
  exportTextOfAnnotationRequest,
} = exportSlice.actions;
export default exportSlice.reducer;
