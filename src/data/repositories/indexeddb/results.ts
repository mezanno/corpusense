import { Result, ResultCreateDTO } from '@/data/models/Result';
import { Scope } from '@/data/models/Scope';
import { db } from './db';
import { ResultRepository } from './types';
import { computeScopeKey } from './utils';

export class IndexedDBResultRepository implements ResultRepository {
  async add(result: ResultCreateDTO): Promise<Result> {
    const newResult = {
      ...result,
      scopeKey: computeScopeKey(result.scope),
    };
    const id = await db.results.add(newResult);
    return { ...newResult, id };
  }

  async addAll(results: Result[]): Promise<void> {
    await db.results.bulkAdd(results);
  }

  // async patch(id: number, changes: Partial<Result>): Promise<void> {
  //   await db.results.update(id, changes);
  // }

  async getAll(): Promise<Result[]> {
    return await db.results.orderBy('id').toArray();
  }

  // async getAllByWorkerName(workerName: string): Promise<Result[]> {
  //   // Note: Using sortBy('taskId') to ensure results are returned in the order of their taskId
  //   return await db.results.where('workerName').equals(workerName).sortBy('taskId');
  // }

  async getAllByWorkerId(workerId: string): Promise<Result[]> {
    // Note: Using sortBy('taskId') to ensure results are returned in the order of their taskId
    return await db.results.where('workerId').equals(workerId).sortBy('taskId');
  }

  async getByScopeAndWorkerName(scope: Scope, workerName: string): Promise<Result> {
    const result = await db.results
      .where({ scopeKey: computeScopeKey(scope), workerName: workerName })
      .first();
    if (result === undefined) {
      throw new Error(`No result found`);
    }
    return result;
  }
}
