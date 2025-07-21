import { Scope } from '@/data/models/Scope';
import { Worker, WorkerCreateDTO, WorkerStatus } from '@/data/models/Worker';
import { v4 as uuid } from 'uuid';
import { db } from './db';
import { WorkerRepository } from './types';
import { getScopeKey } from './utils';
export class IndexedDBWorkerRepository implements WorkerRepository {
  async selectAll(): Promise<Worker[]> {
    return await db.workers.toArray();
  }

  async selectByNameAndScope(workerName: string, scope: Scope): Promise<Worker | undefined> {
    return await db.workers.where({ scopeKey: getScopeKey(scope), name: workerName }).first();
  }

  async add(worker: WorkerCreateDTO): Promise<Worker> {
    const newWorker: Worker = {
      ...worker,
      id: uuid(),
      scopeKey: getScopeKey(worker.scope),
      status: WorkerStatus.INPROGRESS,
      createdAt: new Date().toISOString(),
      queue: [],
      estimatedDuration: 0, // Default to 0, can be updated later
    };
    await db.workers.add(newWorker);
    return newWorker;
  }

  async update(worker: Worker): Promise<void> {
    await db.workers.put(worker);
  }

  async patch(id: string, changes: Partial<Worker>): Promise<void> {
    await db.workers.update(id, changes);
  }

  async delete(worker: Worker): Promise<void> {
    await db.workers.delete(worker.id);
    await db.results.where('workerId').equals(worker.id).delete();
  }
}
