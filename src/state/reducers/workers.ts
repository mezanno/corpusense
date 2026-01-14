import { Scope } from '@/data/models/Scope';
import { Worker } from '@/data/models/Worker';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
export interface WorkerState {
  workerPluginsInfo: {
    name: string;
    hasExport: boolean;
    displayName?: string;
    description?: string;
    category?: string;
    exportFormats?: string[];
    batchCompatible?: boolean;
  }[];
}

export const workerInitialState: WorkerState = {
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
  batchMode?: boolean;
}

export const workerSlice = createSlice({
  name: 'worker',
  initialState: workerInitialState,
  reducers: {
    startWorkerProcessRequest: (_state, _action: PayloadAction<StartWorkerProcessPayload>) => {},
    stopWorkerProcessRequest: (_state, _action: PayloadAction<Worker>) => {},
    setPlugins(
      state,
      action: PayloadAction<
        {
          name: string;
          hasExport: boolean;
          displayName?: string;
          description?: string;
          category?: string;
          exportFormats?: string[];
          batchCompatible?: boolean;
        }[]
      >,
    ) {
      state.workerPluginsInfo = action.payload;
    },
    recoverWorkerRequest: (_state, _action: PayloadAction<Worker>) => {}, // action.payload is a workerId
  },
});

export const {
  startWorkerProcessRequest,
  stopWorkerProcessRequest,
  setPlugins,
  recoverWorkerRequest,
} = workerSlice.actions;
export default workerSlice.reducer;
