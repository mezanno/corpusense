import { Result } from '@/data/models/Result';
import { isCollectionScope, isSameScope, Scope } from '@/data/models/Scope';
import { Task, Worker, WorkerStatus } from '@/data/models/Worker';
import {
  getResultLiveRepository,
  getWorkerLiveRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { createContext, useContext, useMemo } from 'react';

type WorkerContextValue = {
  workers: Worker[];
  getWorkerById: (id: string) => Worker | undefined;
  getTaskById: (workerId: string, taskId: number) => Task | undefined;
  getWorkersByStatus: (status: WorkerStatus | WorkerStatus[]) => Worker[];
  getStatus: (scope: Scope) => WorkerStatus | undefined;
  isWorkerOrTaskRunning: (scope: Scope) => boolean;
  hasResult: (workerId: string) => boolean;
  getWorkersByScope: (scope: Scope) => Worker[];
  getWorkersByScopeAndStatus: (scope: Scope, status: WorkerStatus | WorkerStatus[]) => Worker[];
};

const WorkerContext = createContext<WorkerContextValue | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export const WorkerProvider = ({ children }: Props) => {
  const workerLiveRepository = useMemo(() => getWorkerLiveRepository(), []);
  const resultLiveRepository = useMemo(() => getResultLiveRepository(), []);

  const workers: Worker[] = useLiveQuery(workerLiveRepository.getAll(), [workerLiveRepository], []);
  const results: Result[] = useLiveQuery(resultLiveRepository.getAll(), [resultLiveRepository], []);

  const value = useMemo<WorkerContextValue>(() => {
    const getWorkerById = (id: string) => workers.find((c) => c.id === id);

    const getTaskById = (workerId: string, taskId: number) => {
      const worker = workers.find((c) => c.id === workerId);
      if (worker === undefined) {
        return undefined;
      }
      // console.log('worker founded: ', worker);

      return worker.queue.find((t) => t.id === taskId);
    };

    const getWorkersByStatus = (status: WorkerStatus | WorkerStatus[]) => {
      const statuses = Array.isArray(status) ? status : [status];
      return Object.values(workers)
        .filter((worker) => statuses.includes(worker.status))
        .sort((w1, w2) => w1.name.localeCompare(w2.name));
    };

    const getWorkersByScopeAndStatus = (scope: Scope, status: WorkerStatus | WorkerStatus[]) => {
      const statuses = Array.isArray(status) ? status : [status];
      return Object.values(workers)
        .filter((worker) => isSameScope(worker.scope, scope) && statuses.includes(worker.status))
        .sort((w1, w2) => w1.name.localeCompare(w2.name));
    };

    const getWorkersByScope = (scope: Scope) => {
      return Object.values(workers)
        .filter((worker) => isSameScope(worker.scope, scope))
        .sort((w1, w2) => w1.name.localeCompare(w2.name));
    };

    /**
     * Get the worker related to a canvas
     * @param state
     * @param scope The scope of the canvas (collectionId + canvasId)
     * @returns
     */
    const getStatus = (scope: Scope) => {
      const existingWorker = workers.find((worker) => isSameScope(worker.scope, scope));
      if (existingWorker !== undefined) {
        return existingWorker.status;
      }
      // If no worker is found, check if a worker is running and has a task for the given scope
      const runningWorkers = workers.filter(
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

    const isWorkerOrTaskRunning = (scope: Scope) => {
      //check if there is a worker running for the given scope
      //a worker is running if its status is INPROGRESS, INPROGRESS_WITH_ERRORS
      const isRunning = workers.some(
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
      for (let j = 0; j < workers.length; j++) {
        const worker = workers[j];
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

    const hasResult = (workerId: string) =>
      results?.some((result) => result.workerId === workerId) ?? false;

    return {
      workers,
      getWorkerById,
      getTaskById,
      getWorkersByStatus,
      getStatus,
      isWorkerOrTaskRunning,
      hasResult,
      getWorkersByScope,
      getWorkersByScopeAndStatus,
    };
  }, [workers, results]);

  return <WorkerContext.Provider value={value}>{children}</WorkerContext.Provider>;
};

export const useWorkerContext = () => {
  const ctx = useContext(WorkerContext);
  if (!ctx) {
    throw new Error('useWorkerContext must be used inside <WorkerContextProvider>');
  }
  return ctx;
};
