import { isSameScope, WorkerScope, WorkerStatus } from '@/data/models/Worker';
import { RootState } from '../store';

export const isWorkerRunning = (state: RootState, scope: WorkerScope) => {
  return state.workers.status.find((s) => isSameScope(s.scope, scope)) !== undefined;
};

// /**
//  * Get the worker related to a canvas
//  * @param state
//  * @param id CanvasId
//  * @returns
//  */
export const getStatus = (state: RootState, scope: WorkerScope) => {
  return state.workers.status.find((s) => isSameScope(s.scope, scope));
};

export const getWorkers = (state: RootState) => {
  return state.workers.workers;
};

export const getWorkersByStatus = (state: RootState, scope: WorkerScope, status: WorkerStatus) => {
  return Object.values(state.workers.workers)
    .filter((worker) => isSameScope(worker.scope, scope))
    .filter((worker) => worker.status === status)
    .sort((w1, w2) => w1.name.localeCompare(w2.name));
};
