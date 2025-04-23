import { WorkerStatus } from '../reducers/workers';
import { RootState } from '../store';

export const isWorkerRunning = (state: RootState, id: string) => {
  const worker = state.workers.workers[id];
  return worker !== undefined ? worker.status === WorkerStatus.PENDING : false;
};

/**
 * Get the worker related to a canvas
 * @param state
 * @param id CanvasId
 * @returns
 */
export const getWorker = (state: RootState, id: string) => {
  const worker = state.workers.workers[id];
  return worker !== undefined ? worker : null;
};
