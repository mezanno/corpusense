import { Canvas } from '@iiif/presentation-3';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const WorkerStatus = {
  IDLE: 'idle',
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
};

export interface WorkerState {
  global: {
    error: string;
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
  },
  workers: {},
};

export interface fetchOcrPayload {
  canvas: Canvas;
  region?: { left: number; top: number; width: number; height: number };
}

export interface fetchLayoutPayload {
  imageUrl: string;
  canvasId: string;
  originalWidth: number;
}

export const workerSlice = createSlice({
  name: 'worker',
  initialState: workerInitialState,
  reducers: {
    fetchLayoutRequest: (_state, _action: PayloadAction<fetchLayoutPayload>) => {},
    fetchOcrRequest: (_state, _action: PayloadAction<fetchOcrPayload>) => {},
    fetchBatchOcrRequest: (_state, _action: PayloadAction<string>) => {
      //action.payload is a collectionId
    },
    processStart: (state, action: PayloadAction<string>) => {
      //action.payload is a canvasId
      state.workers[action.payload] = {
        result: '',
        status: WorkerStatus.PENDING,
        error: '',
      };
    },
    processSuccess: (
      state,
      action: PayloadAction<{ canvasId: string; result: string | object }>,
    ) => {
      console.log('processSuccess: ', action);
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
  },
});

export const {
  fetchLayoutRequest,
  fetchOcrRequest,
  fetchBatchOcrRequest,
  processError,
  processSuccess,
  processStart,
  resetLastWorkerError,
} = workerSlice.actions;
export default workerSlice.reducer;
