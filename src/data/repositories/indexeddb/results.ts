import { Result, ResultCreateDTO } from '@/data/models/Result';
import { Scope } from '@/data/models/Scope';
import { db } from './db';
import { ResultRepository } from './types';
import { getScopeKey } from './utils';

export class IndexedDBResultRepository implements ResultRepository {
  async addResult(result: ResultCreateDTO): Promise<Result> {
    const newResult = {
      ...result,
      scopeKey: getScopeKey(result.scope),
    };
    const id = await db.results.add(newResult);
    return { ...newResult, id };
  }

  async patch(id: number, changes: Partial<Result>): Promise<void> {
    await db.results.update(id, changes);
  }

  async selectAll(): Promise<Result[]> {
    return await db.results.orderBy('id').toArray();
  }

  async selectByWorkerName(workerName: string): Promise<Result[]> {
    // Note: Using sortBy('taskId') to ensure results are returned in the order of their taskId
    return await db.results.where('workerName').equals(workerName).sortBy('taskId');
  }

  async selectByWorkerId(workerId: string): Promise<Result[]> {
    // Note: Using sortBy('taskId') to ensure results are returned in the order of their taskId
    return await db.results.where('workerId').equals(workerId).sortBy('taskId');
  }

  async selectByScopeAndWorkerName(scope: Scope, workerName: string): Promise<Result> {
    const result = await db.results
      .where({ scopeKey: getScopeKey(scope), workerName: workerName })
      .first();
    if (result === undefined) {
      throw new Error(`No result found`);
    }
    return result;
  }
}
