import { isCollectionScope, isSameScope, Scope } from '@/data/models/Scope';
import { Worker, WorkerStatus } from '@/data/models/Worker';
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectIsWorkerOrTaskRunning = (state: RootState, scope: Scope) => {
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
  } else if (isCollectionScope(scope)) {
    return false;
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
export const selectStatus = (state: RootState, scope: Scope) => {
  const existingWorker = state.workers.workers.find((worker) => isSameScope(worker.scope, scope));
  if (existingWorker !== undefined) {
    return existingWorker.status;
  }
  // If no worker is found, check if a worker is running and has a task for the given scope
  const runningWorkers = state.workers.workers.filter(
    (worker) =>
      worker.status === WorkerStatus.INPROGRESS ||
      worker.status === WorkerStatus.INPROGRESS_WITH_ERRORS,
  );
  for (let j = 0; j < runningWorkers.length; j++) {
    const worker = runningWorkers[j];
    for (let i = 0; i < worker.queue.length; i++) {
      const task = worker.queue[i];
      if (
        isSameScope(task.scope, scope) &&
        (task.status === WorkerStatus.INPROGRESS || task.status === WorkerStatus.WAITING)
      ) {
        return task.status;
      }
    }
  }
  return undefined;
};

export const selectWorkers = (state: RootState) => state.workers.workers;

export const selectWorkerById = (state: RootState, id: string): Worker | undefined => {
  return state.workers.workers.find((worker) => worker.id === id);
};

export const selectWorkersByStatus = createSelector(
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

export const selectWorkersByScopeAndStatus = createSelector(
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

export const selectHasResult = (state: RootState, workerId: string) =>
  state.workers.results?.some((result) => result.workerId === workerId) ?? false;

export const selectHasExport = (state: RootState, workerName: string) =>
  state.workers.workerPluginsInfo?.some(
    (plugin) => plugin.name === workerName && plugin.hasExport,
  ) ?? false;

export const selectExportFormats = (state: RootState, workerName: string) => {
  const plugin = state.workers.workerPluginsInfo?.find((wp) => wp.name === workerName);
  return plugin?.exportFormats ?? [];
};

export const selectWorkerPluginsInfo = (state: RootState) => state.workers.workerPluginsInfo;
