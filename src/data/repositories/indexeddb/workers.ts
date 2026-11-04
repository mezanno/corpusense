import { Scope } from '@/data/models/scope/scope';
import { isCollectionScope } from '@/data/models/scope/scope.utils';
import { Task, Worker, WorkerStatus } from '@/data/models/worker/worker';
import { WorkerCreateDTO } from '@/data/models/worker/worker.dto';
import {
  isWorkerUnfinished,
  StatusChangeError,
  TaskEvent,
  transitionTaskStatus,
  transitionWorkerStatus,
  WorkerLifecycleEvent,
  workerStatusOf,
} from '@/data/models/worker/workerStatusLaw';
import { FunctionResult } from '@/utils/functionResult';
import { EntityNotFoundError } from '../EntityNotFoundError';
import { db } from './db';
import { WorkerRepository } from './types';
import { computeScopeKey } from './utils';

export class IndexedDBWorkerRepository implements WorkerRepository {
  async getAll(): Promise<Worker[]> {
    return await db.workers.toArray();
  }

  async getById(id: string): Promise<FunctionResult<Worker, EntityNotFoundError>> {
    const worker = await db.workers.get(id);
    if (!worker) {
      return FunctionResult.err(new EntityNotFoundError({ entity: 'Worker', id }));
    }
    return FunctionResult.ok(worker);
  }

  async getByScope(scope: Scope, subScope: boolean): Promise<Worker[]> {
    if (subScope) {
      return await db.workers
        .where('scopeKey')
        .startsWithIgnoreCase(computeScopeKey(scope))
        .toArray();
    }
    return await db.workers.where('scopeKey').equals(computeScopeKey(scope)).toArray();
  }

  async getByNamesAndScope(workerNames: string[], scope: Scope): Promise<Worker[]> {
    const scopeKey = computeScopeKey(scope);

    const workers = await db.workers
      .where('[scopeKey+name]')
      .anyOf(workerNames.map((name) => [scopeKey, name]))
      .toArray();

    // Sort workers by createdAt in descending order
    return workers.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async add(worker: WorkerCreateDTO, queue: Task[] = []): Promise<Worker> {
    const newWorker: Worker = {
      ...worker,
      scopeKey: computeScopeKey(worker.scope),
      status: WorkerStatus.INPROGRESS,
      createdAt: new Date().toISOString(),
      queue,
      estimatedDuration: 0, // Default to 0, can be updated later
    };
    await db.workers.add(newWorker);
    return newWorker;
  }

  async addAll(workers: Worker[]): Promise<void> {
    await db.workers.bulkAdd(workers);
  }

  async patch(id: string, changes: Partial<Omit<Worker, 'status' | 'queue'>>): Promise<void> {
    await db.workers.update(id, changes);
  }

  async updateWorkerStatus(
    workerId: string,
    event: WorkerLifecycleEvent,
  ): Promise<FunctionResult<Worker, EntityNotFoundError | StatusChangeError>> {
    return await db.transaction('rw', db.workers, async () => {
      const worker = await db.workers.get(workerId);
      if (!worker) {
        return FunctionResult.err(new EntityNotFoundError({ entity: 'Worker', id: workerId }));
      }
      const statusResult = transitionWorkerStatus(worker, event);
      if (!statusResult.ok) return statusResult;

      const updatedWorker = { ...worker, status: statusResult.value };
      await db.workers.update(workerId, { status: updatedWorker.status });
      return FunctionResult.ok(updatedWorker);
    });
  }

  async updateTaskStatus(
    workerId: string,
    taskId: number,
    event: TaskEvent,
    statusMessage?: string,
  ): Promise<FunctionResult<Task, EntityNotFoundError | StatusChangeError>> {
    return await db.transaction('rw', db.workers, async () => {
      const worker = await db.workers.get(workerId);
      if (!worker) {
        return FunctionResult.err(new EntityNotFoundError({ entity: 'Worker', id: workerId }));
      }
      const taskIndex = worker.queue.findIndex((task) => task.id === taskId);
      if (taskIndex === -1) {
        return FunctionResult.err(
          new EntityNotFoundError({ entity: 'Task', id: `${workerId}_${taskId}` }),
        );
      }

      const task = worker.queue[taskIndex];
      const statusResult = transitionTaskStatus(task.status, event, workerId, taskId);
      if (!statusResult.ok) return statusResult;

      const updatedTask: Task = {
        ...task,
        status: statusResult.value,
        statusMessage,
      };
      const updatedQueue = worker.queue.map((queuedTask, index) =>
        index === taskIndex ? updatedTask : queuedTask,
      );
      const status = isWorkerUnfinished(worker.status)
        ? worker.status
        : workerStatusOf(updatedQueue);

      await db.workers.update(workerId, { status, queue: updatedQueue });
      return FunctionResult.ok(updatedTask);
    });
  }

  async deleteById(workerId: string): Promise<void> {
    await db.transaction('rw', db.workers, db.results, async () => {
      await db.workers.delete(workerId);
      await db.results.where('workerId').equals(workerId).delete();
    });
  }

  async deleteByScope(scope: Scope): Promise<string[]> {
    const scopeKey = computeScopeKey(scope);
    let workersToDelete = [];
    if (isCollectionScope(scope)) {
      workersToDelete = await db.workers.where('scopeKey').startsWithIgnoreCase(scopeKey).toArray();
    } else {
      workersToDelete = await db.workers.where('scopeKey').equals(scopeKey).toArray();
    }
    const workerIds = workersToDelete.map((worker) => worker.id);
    await db.transaction('rw', db.workers, db.results, async () => {
      await db.workers.bulkDelete(workerIds);
      await db.results.where('workerId').anyOf(workerIds).delete();
      return workerIds;
    });
    return [];
  }

  async deleteResultById(workerId: string, taskId: number): Promise<void> {
    await db.transaction('rw', db.workers, db.results, async () => {
      await db.results.where({ workerId, taskId }).delete();
    });
  }
}
