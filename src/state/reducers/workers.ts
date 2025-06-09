import { DataModel } from '@/data/models/DataModel';
import { Result } from '@/data/models/Result';
import { Worker, WorkerScope } from '@/data/models/Worker';
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
    string, //canvasId | collectionId
    {
      result?: string | object;
      status: string;
      error?: string;
    }
  >;
  newWorker: Worker[];
  results: Result[];
}

export const workerInitialState: WorkerState = {
  global: {
    error: '',
    lastEvent: '',
  },
  workers: {},
  newWorker: [],
  results: [],
};

export interface fetchOcrPayload {
  canvas: Canvas;
  collectionId: string;
  region?: { left: number; top: number; width: number; height: number };
}

export interface fetchLayoutPayload {
  canvas: Canvas;
  collectionId: string;
  originalWidth: number;
}

export interface fetchDataAnalysisPayload {
  canvasId: string;
  collectionId: string;
  model: DataModel;
}
export interface fetchBatchDataAnalysisPayload {
  collectionId: string;
  model: DataModel;
}
export interface PluginParams {
  scope: WorkerScope;
  workerId?: string;
  [key: string]: unknown;
}

export interface StartWorkerProcessPayload {
  workerName: string;
  params: PluginParams;
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
    fetchDataAnalysisRequest: (_state, _action: PayloadAction<fetchDataAnalysisPayload>) => {},
    fetchBatchDataAnalysisRequest: (
      _state,
      _action: PayloadAction<fetchBatchDataAnalysisPayload>,
    ) => {},
    processStart: (state, action: PayloadAction<string>) => {
      //action.payload is a canvasId or collectionId
      state.workers[action.payload] = {
        status: WorkerStatus.PENDING,
      };
    },
    processRunning: (state, action: PayloadAction<string>) => {
      //action.payload is a canvasId or collectionId
      state.workers[action.payload] = {
        status: WorkerStatus.PROCESSING,
        result: '',
        error: '',
      };
    },
    processSuccess: (state, action: PayloadAction<{ id: string; result: string | object }>) => {
      state.global.lastEvent = i18next.t('info_finish_analysis', {
        canvas: action.payload.id,
      });
      state.workers[action.payload.id] = {
        result: action.payload.result,
        status: WorkerStatus.SUCCESS,
      };
    },
    processError: (state, action: PayloadAction<{ id: string | null; error: string }>) => {
      if (action.payload.id !== null) {
        state.workers[action.payload.id] = {
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
      //action.payload is a canvasId or collectionId
      state.workers[action.payload] = {
        result: '',
        status: WorkerStatus.IDLE,
        error: '',
      };
    },
    startWorkerProcess: (_state, _action: PayloadAction<StartWorkerProcessPayload>) => {},
    setWorkerStatus: (state, action: PayloadAction<Worker>) => {
      if (state.newWorker.find((w) => w.id === action.payload.id)) {
        // If the worker already exists, update it
        const index = state.newWorker.findIndex((w) => w.id === action.payload.id);
        state.newWorker[index] = action.payload;
      } else {
        // If the worker does not exist, add it
        state.newWorker.push(action.payload);
      }
    },
    setWorkers: (state, action: PayloadAction<Worker[]>) => {
      state.newWorker = action.payload;
    },
    setResults: (state, action: PayloadAction<Result[]>) => {
      state.results = action.payload;
    },
    exportWorkerResultRequest: (_state, _action: PayloadAction<Worker>) => {}, // action.payload is a workerId
  },
});

export const {
  fetchLayoutRequest,
  fetchBatchLayoutRequest,
  fetchOcrRequest,
  fetchBatchOcrRequest,
  fetchDataAnalysisRequest,
  fetchBatchDataAnalysisRequest,
  processError,
  processSuccess,
  processRunning,
  processStart,
  resetLastWorkerError,
  resetLastEvent,
  resetCanvasProcess,
  startWorkerProcess,
  setWorkerStatus,
  setWorkers,
  setResults,
  exportWorkerResultRequest,
} = workerSlice.actions;
export default workerSlice.reducer;
