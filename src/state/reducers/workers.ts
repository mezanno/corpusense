import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const WorkerStatus = {
  IDLE: 'idle',
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
};

type WorkerState = Record<
  string,
  { result?: string | object; status: string; error?: string }
> | null;

const initialState: WorkerState = {};

export interface StartProcessPayload {
  imageUrl: string;
  canvasId: string;
  originalWidth: number;
}

export const workerSlice = createSlice({
  name: 'worker',
  initialState,
  reducers: {
    startProcess: (state, action: PayloadAction<StartProcessPayload>) => {
      const url = action.payload.imageUrl;
      state[url] = {
        result: '',
        status: WorkerStatus.PENDING,
        error: '',
      };
    },
    processSuccess: (state, action: PayloadAction<{ url: string; result: string | object }>) => {
      const url = action.payload.url;
      console.log('processSuccess: ', action);
      state[url] = {
        result: action.payload.result,
        status: WorkerStatus.SUCCESS,
      };
    },
    processError: (state, action: PayloadAction<{ url: string; error: string }>) => {
      const url = action.payload.url;
      state[url] = {
        status: WorkerStatus.ERROR,
        error: action.payload.error,
      };
    },
  },
});

export const { startProcess, processError, processSuccess } = workerSlice.actions;
export default workerSlice.reducer;
