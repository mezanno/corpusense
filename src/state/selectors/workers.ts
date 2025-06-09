import { isSameScope, WorkerScope, WorkerStatus } from '@/data/models/Worker';
import { WorkerStatus as WS } from '../reducers/workers';
import { RootState } from '../store';

export const isWorkerRunning = (state: RootState, id: string) => {
  const worker = state.workers.workers[id];
  return worker !== undefined ? worker.status === WS.PENDING : false;
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

export const getWorkers = (state: RootState) => {
  return state.workers.newWorker;
};

export const getWorkersByStatus = (state: RootState, scope: WorkerScope, status: WorkerStatus) => {
  return Object.values(state.workers.newWorker)
    .filter((worker) => isSameScope(worker.scope, scope))
    .filter((worker) => worker.status === status)
    .sort((w1, w2) => w1.name.localeCompare(w2.name));
};
