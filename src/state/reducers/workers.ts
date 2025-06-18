import { DataModel } from '@/data/models/DataModel';
import { Result } from '@/data/models/Result';
import { isSameScope, Worker, WorkerScope, WorkerStatus } from '@/data/models/Worker';
import { Canvas } from '@iiif/presentation-3';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
export interface WorkerState {
  status: {
    scope: WorkerScope;
    status: WorkerStatus;
  }[];
  workers: Worker[];
  results: Result[];
}

export const workerInitialState: WorkerState = {
  status: [],
  workers: [],
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
    fetchLayoutRequest: (_state, _action: PayloadAction<fetchLayoutPayload>) => {},
    fetchBatchLayoutRequest: (_state, _action: PayloadAction<string>) => {
      //action.payload is a collectionId
    },
    fetchOcrRequest: (_state, _action: PayloadAction<fetchOcrPayload>) => {},
    fetchBatchOcrRequest: (_state, _action: PayloadAction<string>) => {
      //action.payload is a collectionId
    },
    fetchDataAnalysisRequest: (_state, _action: PayloadAction<fetchDataAnalysisPayload>) => {},
    fetchBatchDataAnalysisRequest: (
      _state,
      _action: PayloadAction<fetchBatchDataAnalysisPayload>,
    ) => {},
    processStart: (state, action: PayloadAction<WorkerScope>) => {
      const scope = action.payload;
      const existing = state.status.find((s) => isSameScope(s.scope, scope));
      if (existing) {
        existing.status = WorkerStatus.WAITING;
      } else {
        state.status.push({ scope, status: WorkerStatus.WAITING });
      }
    },
    processRunning: (state, action: PayloadAction<WorkerScope>) => {
      const scope = action.payload;
      const existing = state.status.find((s) => isSameScope(s.scope, scope));
      if (existing) {
        existing.status = WorkerStatus.INPROGRESS;
      } else {
        state.status.push({ scope, status: WorkerStatus.INPROGRESS });
      }
    },
    processSuccess: (state, action: PayloadAction<WorkerScope>) => {
      //when the process if finish with success, remove it
      const scope = action.payload;
      state.status = state.status.filter((s) => !isSameScope(s.scope, scope));
    },
    processError: (_state, action: PayloadAction<{ id: string | null; error: string }>) => {
      if (action.payload.id !== null) {
        // state.workers[action.payload.id] = {
        //   status: WorkerStatus.ERROR,
        //   error: action.payload.error,
        // };
      }
      // state.global.error = action.payload.error;
    },
    startWorkerProcess: (_state, _action: PayloadAction<StartWorkerProcessPayload>) => {},
    setWorkerStatus: (state, action: PayloadAction<Worker>) => {
      if (state.workers.find((w) => w.id === action.payload.id)) {
        // If the worker already exists, update it
        const index = state.workers.findIndex((w) => w.id === action.payload.id);
        state.workers[index] = action.payload;
      } else {
        // If the worker does not exist, add it
        state.workers.push(action.payload);
      }
    },
    setWorkers: (state, action: PayloadAction<Worker[]>) => {
      state.workers = action.payload;
    },
    setResults: (state, action: PayloadAction<Result[]>) => {
      state.results = action.payload;
    },
    exportWorkerResultRequest: (_state, _action: PayloadAction<Worker>) => {}, // action.payload is a workerId
    recoverWorkerRequest: (_state, _action: PayloadAction<Worker>) => {}, // action.payload is a workerId
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
  startWorkerProcess,
  setWorkerStatus,
  setWorkers,
  setResults,
  exportWorkerResultRequest,
  recoverWorkerRequest,
} = workerSlice.actions;
export default workerSlice.reducer;
