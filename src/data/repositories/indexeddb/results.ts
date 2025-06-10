import { Result, ResultCreateDTO } from '@/data/models/Result';
import { db } from './db';
import { ResultRepository } from './types';

export class IndexedDBResultRepository implements ResultRepository {
  async addResult(result: ResultCreateDTO): Promise<void> {
    await db.results.add(result);
  }

  async selectAll(): Promise<Result[]> {
    return await db.results.orderBy('id').toArray();
  }

  async selectByWorkerName(workerName: string): Promise<Result[]> {
    return await db.results.where('workerName').equals(workerName).sortBy('id');
  }
}
