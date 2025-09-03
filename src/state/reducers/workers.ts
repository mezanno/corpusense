import { Result } from '@/data/models/Result';
import { isSameScope, Scope } from '@/data/models/Scope';
import { Worker, WorkerStatus } from '@/data/models/Worker';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
export interface WorkerState {
  workers: Worker[];
  results: Result[];
  status: { scope: Scope; status: WorkerStatus }[];
  workerPluginsInfo: {
    name: string;
    hasExport: boolean;
  }[];
}

export const workerInitialState: WorkerState = {
  workers: [],
  results: [],
  status: [],
  workerPluginsInfo: [],
};

export interface PluginParams {
  workerId?: string;
  [key: string]: unknown;
}

export interface StartWorkerProcessPayload {
  workerName: string;
  scope: Scope;
  params: PluginParams;
}

export interface ExportWorkerPayload {
  worker: Worker;
}

export const workerSlice = createSlice({
  name: 'worker',
  initialState: workerInitialState,
  reducers: {
    processSuccess: (state, action: PayloadAction<Scope>) => {
      //when the process if finish with success, remove it
      const scope = action.payload;
      state.status = state.status.filter((s) => !isSameScope(s.scope, scope));
    },
    startWorkerProcess: (_state, _action: PayloadAction<StartWorkerProcessPayload>) => {},
    stopWorkerProcessRequest: (_state, _action: PayloadAction<Worker>) => {},
    updateWorker: (state, action: PayloadAction<Worker>) => {
      if (state.workers.find((w) => w.id === action.payload.id)) {
        // If the worker already exists, update it
        const index = state.workers.findIndex((w) => w.id === action.payload.id);
        state.workers[index] = action.payload;
      } else {
        // If the worker does not exist, add it
        state.workers.push(action.payload);
      }
    },
    addResult: (state, action: PayloadAction<Result>) => {
      const result = action.payload;
      // Check if the result already exists
      const existingResult = state.results.find(
        (r) =>
          r.id === result.id &&
          r.workerId === result.workerId &&
          isSameScope(r.scope, result.scope),
      );
      if (existingResult) {
        // If it exists, update the existing result
        const index = state.results.findIndex(
          (r) =>
            r.id === result.id &&
            r.workerId === result.workerId &&
            isSameScope(r.scope, result.scope),
        );
        state.results[index] = result;
      } else {
        // If it does not exist, add the new result
        state.results.push(result);
      }
    },
    setWorkers: (state, action: PayloadAction<Worker[]>) => {
      state.workers = action.payload;
    },
    setResults: (state, action: PayloadAction<Result[]>) => {
      state.results = action.payload;
    },
    setPlugins(state, action: PayloadAction<{ name: string; hasExport: boolean }[]>) {
      state.workerPluginsInfo = action.payload;
    },
    removeWorkerRequest: (_state, _action: PayloadAction<string>) => {
      //payload is workerId
    },
    removeWorkerSuccess: (state, action: PayloadAction<string>) => {
      //payload is workerId
      state.workers = state.workers.filter((worker) => worker.id !== action.payload);
      state.results = state.results.filter((result) => result.workerId !== action.payload);
    },
    removeWorkerByScopeRequest: (state, _action: PayloadAction<Scope>) => {
      state.workers = state.workers.filter((worker) => !isSameScope(worker.scope, _action.payload));
      state.results = state.results.filter((result) => !isSameScope(result.scope, _action.payload));
    },
    exportWorkerResultRequest: (_state, _action: PayloadAction<ExportWorkerPayload>) => {}, // action.payload is a workerId
    recoverWorkerRequest: (_state, _action: PayloadAction<Worker>) => {}, // action.payload is a workerId
  },
});

export const {
  processSuccess,
  startWorkerProcess,
  stopWorkerProcessRequest,
  updateWorker,
  addResult,
  setWorkers,
  setResults,
  setPlugins,
  removeWorkerRequest,
  removeWorkerSuccess,
  removeWorkerByScopeRequest,
  exportWorkerResultRequest,
  recoverWorkerRequest,
} = workerSlice.actions;
export default workerSlice.reducer;
