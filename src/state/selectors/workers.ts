import { isSameScope, Scope } from '@/data/models/Scope';
import { Worker, WorkerStatus } from '@/data/models/Worker';
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const isWorkerOrTaskRunning = (state: RootState, scope: Scope) => {
  //check if there is a worker running for the given scope
  //a worker is running if its status is INPROGRESS, INPROGRESS_WITH_ERRORS
  const isRunning = state.workers.workers.some(
    (worker) =>
      isSameScope(worker.scope, scope) &&
      (worker.status === WorkerStatus.INPROGRESS ||
        worker.status === WorkerStatus.INPROGRESS_WITH_ERRORS),
  );
  if (isRunning) {
    return true;
  }
  //check if a running worker contains the a task with the scope in its queue
  for (let j = 0; j < state.workers.workers.length; j++) {
    const worker = state.workers.workers[j];
    if (
      worker.status === WorkerStatus.INPROGRESS ||
      worker.status === WorkerStatus.INPROGRESS_WITH_ERRORS
    ) {
      for (let i = 0; i < worker.queue.length; i++) {
        const task = worker.queue[i];
        if (
          (isSameScope(task.scope, scope) && task.status === WorkerStatus.INPROGRESS) ||
          task.status === WorkerStatus.WAITING
        ) {
          return true;
        }
      }
    }
  }

  return false;
};

// /**
//  * Get the worker related to a canvas
//  * @param state
//  * @param scope The scope of the canvas (collectionId + canvasId)
//  * @returns
//  */
export const getStatus = (state: RootState, scope: Scope) => {
  const existingWorker = state.workers.workers.find((worker) => isSameScope(worker.scope, scope));
  if (existingWorker !== undefined) {
    return existingWorker.status;
  }

  // If no worker is found, check if a worker is running a task for the given scope
  for (let j = 0; j < state.workers.workers.length; j++) {
    const worker = state.workers.workers[j];
    if (
      worker.status === WorkerStatus.INPROGRESS ||
      worker.status === WorkerStatus.INPROGRESS_WITH_ERRORS
    ) {
      for (let i = 0; i < worker.queue.length; i++) {
        const task = worker.queue[i];
        if (
          (isSameScope(task.scope, scope) && task.status === WorkerStatus.INPROGRESS) ||
          task.status === WorkerStatus.WAITING
        ) {
          return task.status;
        }
      }
    }
  }

  console.log('No worker or task found for scope:', scope);

  return undefined;
};

export const getWorkers = (state: RootState) => state.workers.workers;

export const getWorkerById = (state: RootState, id: string): Worker | undefined => {
  return state.workers.workers.find((worker) => worker.id === id);
};

export const getWorkersByStatus = createSelector(
  [
    (state: RootState) => state.workers.workers,
    (_state: RootState, status: WorkerStatus | WorkerStatus[]) => status,
  ],
  (workers, status): Worker[] => {
    const statuses = Array.isArray(status) ? status : [status];
    return Object.values(workers)
      .filter((worker) => statuses.includes(worker.status))
      .sort((w1, w2) => w1.name.localeCompare(w2.name));
  },
);

export const getWorkersByScopeAndStatus = createSelector(
  [
    (state: RootState) => state.workers.workers,
    (_state: RootState, scope: Scope) => scope,
    (_state: RootState, _scope: Scope, status: WorkerStatus | WorkerStatus[]) => status,
  ],
  (workers, scope, status): Worker[] => {
    const statuses = Array.isArray(status) ? status : [status];
    return Object.values(workers)
      .filter((worker) => isSameScope(worker.scope, scope) && statuses.includes(worker.status))
      .sort((w1, w2) => w1.name.localeCompare(w2.name));
  },
);

export const getCompletedWorkerByScopeAndName = createSelector(
  [
    (state: RootState) => state.workers.workers,
    (_state: RootState, scope: Scope) => scope,
    (_state: RootState, _scope: Scope, name: string) => name,
  ],
  (workers, scope, name): Worker | undefined => {
    return Object.values(workers).find(
      (worker) =>
        isSameScope(worker.scope, scope) &&
        worker.name === name &&
        worker.status === WorkerStatus.COMPLETED,
    );
  },
);
