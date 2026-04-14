import { CanvasScope, CollectionScope } from '@/data/models/Scope';
import { Worker } from '@/data/models/Worker';
import { db } from '../db';
import { computeScopeKey } from '../utils';
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

  hasResult(scope: CanvasScope | CollectionScope, workerName: string): () => Promise<boolean> {
    return () =>
      db.workers
        .where({ '[scopeKey+name]': [computeScopeKey(scope), workerName] })
        .count()
        .then((count) => count > 0);
  }
}
