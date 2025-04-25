import { Canvas } from '@iiif/presentation-3';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import i18next from 'i18next';

export const WorkerStatus = {
  IDLE: 'idle',
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error',
};

export interface WorkerState {
  global: {
    error: string;
    lastEvent: string;
  };
  workers: Record<
    string, //canvasId
    {
      result?: string | object;
      status: string;
      error?: string;
    }
  >;
}

export const workerInitialState: WorkerState = {
  global: {
    error: '',
    lastEvent: '',
  },
  workers: {},
};

export interface fetchOcrPayload {
  canvas: Canvas;
  region?: { left: number; top: number; width: number; height: number };
}

export interface fetchLayoutPayload {
  canvas: Canvas;
  originalWidth: number;
}

export const workerSlice = createSlice({
  name: 'worker',
  initialState: workerInitialState,
  reducers: {
    fetchLayoutRequest: (state, action: PayloadAction<fetchLayoutPayload>) => {
      state.global.lastEvent = i18next.t('info_start_layout', { canvas: action.payload.canvas });
    },
    fetchBatchLayoutRequest: (state, action: PayloadAction<string>) => {
      //action.payload is a collectionId
      state.global.lastEvent = i18next.t('info_start_ocr', { canvas: action.payload });
    },
    fetchOcrRequest: (state, action: PayloadAction<fetchOcrPayload>) => {
      state.global.lastEvent = i18next.t('info_start_ocr', { canvas: action.payload.canvas.id });
    },
    fetchBatchOcrRequest: (state, action: PayloadAction<string>) => {
      //action.payload is a collectionId
      state.global.lastEvent = i18next.t('info_start_ocr', { canvas: action.payload });
    },
    processStart: (state, action: PayloadAction<string>) => {
      //action.payload is a canvasId
      state.workers[action.payload] = {
        status: WorkerStatus.PENDING,
      };
    },
    processRunning: (state, action: PayloadAction<string>) => {
      //action.payload is a canvasId
      state.workers[action.payload] = {
        status: WorkerStatus.PROCESSING,
        result: '',
        error: '',
      };
    },
    processSuccess: (
      state,
      action: PayloadAction<{ canvasId: string; result: string | object }>,
    ) => {
      state.global.lastEvent = i18next.t('info_finish_analysis', {
        canvas: action.payload.canvasId,
      });
      state.workers[action.payload.canvasId] = {
        result: action.payload.result,
        status: WorkerStatus.SUCCESS,
      };
    },
    processError: (state, action: PayloadAction<{ canvasId: string | null; error: string }>) => {
      if (action.payload.canvasId !== null) {
        state.workers[action.payload.canvasId] = {
          status: WorkerStatus.ERROR,
          error: action.payload.error,
        };
      }
      state.global.error = action.payload.error;
    },
    resetLastWorkerError: (state) => {
      state.global.error = '';
    },
    resetLastEvent: (state) => {
      state.global.lastEvent = '';
    },
    resetCanvasProcess: (state, action: PayloadAction<string>) => {
      //action.payload is a canvasId
      state.workers[action.payload] = {
        result: '',
        status: WorkerStatus.IDLE,
        error: '',
      };
    },
  },
});

export const {
  fetchLayoutRequest,
  fetchBatchLayoutRequest,
  fetchOcrRequest,
  fetchBatchOcrRequest,
  processError,
  processSuccess,
  processRunning,
  processStart,
  resetLastWorkerError,
  resetLastEvent,
  resetCanvasProcess,
} = workerSlice.actions;
export default workerSlice.reducer;
