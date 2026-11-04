import { CanvasScope, CollectionScope } from '@/data/models/scope/scope';
import { Worker } from '@/data/models/worker/worker';
import { db } from '../db';
import { computeScopeKey } from '../utils';
import { WorkerLiveRepository } from './types.live';

export class IndexedDBWorkerLiveRepository implements WorkerLiveRepository {
  getAll(): () => Promise<Worker[]> {
    return () => db.workers.toArray();
  }

  hasResult(scope: CanvasScope | CollectionScope, workerNames: string[]): () => Promise<boolean> {
    const scopeKey = computeScopeKey(scope);

    return () =>
      db.workers
        .where('[scopeKey+name]')
        .anyOf(workerNames.map((name) => [scopeKey, name]))
        .count()
        .then((count) => count > 0);
  }
}
