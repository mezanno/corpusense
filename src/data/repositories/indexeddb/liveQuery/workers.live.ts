import { Worker } from '@/data/models/Worker';
import { db } from '../db';
import { WorkerLiveRepository } from './types.live';

export class IndexedDBWorkerLiveRepository implements WorkerLiveRepository {
  getById(id: string): () => Promise<Worker> {
    return async () => {
      const worker = await db.workers.get(id);
      if (worker === undefined) {
        throw new Error(`Worker with id ${id} not found`);
      }
      return worker;
    };
  }

  getAll(): () => Promise<Worker[]> {
    return () => db.workers.toArray();
  }
}
