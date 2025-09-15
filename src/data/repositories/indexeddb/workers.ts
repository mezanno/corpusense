import { isCollectionScope, Scope } from '@/data/models/Scope';
import { Worker, WorkerCreateDTO, WorkerStatus } from '@/data/models/Worker';
import { v4 as uuid } from 'uuid';
import { db } from './db';
import { WorkerRepository } from './types';
import { computeScopeKey } from './utils';
export class IndexedDBWorkerRepository implements WorkerRepository {
  async getAll(): Promise<Worker[]> {
    return await db.workers.toArray();
  }

  async getByNameAndScope(workerName: string, scope: Scope): Promise<Worker | undefined> {
    //TODO return an array
    return await db.workers.where({ scopeKey: computeScopeKey(scope), name: workerName }).first();
  }

  async add(worker: WorkerCreateDTO): Promise<Worker> {
    const newWorker: Worker = {
      ...worker,
      id: uuid(),
      scopeKey: computeScopeKey(worker.scope),
      status: WorkerStatus.INPROGRESS,
      createdAt: new Date().toISOString(),
      queue: [],
      estimatedDuration: 0, // Default to 0, can be updated later
    };
    await db.workers.add(newWorker);
    return newWorker;
  }

  // async update(worker: Worker): Promise<void> {
  //   await db.workers.put(worker);
  // }

  async patch(id: string, changes: Partial<Worker>): Promise<void> {
    await db.workers.update(id, changes);
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
}
