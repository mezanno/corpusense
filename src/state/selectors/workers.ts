import { isSameScope, Scope } from '@/data/models/Scope';
import { Worker, WorkerStatus } from '@/data/models/Worker';
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const isWorkerRunning = (state: RootState, scope: Scope) => {
  return state.workers.status.find((s) => isSameScope(s.scope, scope)) !== undefined;
};

// /**
//  * Get the worker related to a canvas
//  * @param state
//  * @param id CanvasId
//  * @returns
//  */
export const getStatus = (state: RootState, scope: Scope) => {
  return state.workers.status.find((s) => isSameScope(s.scope, scope));
};

export const getWorkers = (state: RootState) => state.workers.workers;

export const getWorkersByScopeAndStatus = createSelector(
  [
    (state: RootState) => state.workers.workers,
    (_state: RootState, scope: Scope) => scope,
    (_state: RootState, _scope: Scope, status: WorkerStatus) => status,
  ],
  (workers, scope, status): Worker[] => {
    return Object.values(workers)
      .filter((worker) => isSameScope(worker.scope, scope) && worker.status === status)
      .sort((w1, w2) => w1.name.localeCompare(w2.name));
  },
);
