import { Worker } from '@/data/models/Worker';
import { db } from './db';
import { WorkerRepository } from './types';

export class IndexedDBWorkerRepository implements WorkerRepository {
  async add(worker: Worker): Promise<void> {
    await db.workers.add(worker);
  }

  async update(worker: Worker): Promise<void> {
    await db.workers.put(worker);
  }

  async selectAll(): Promise<Worker[]> {
    return await db.workers.toArray();
  }
}
