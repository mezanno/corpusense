import { Result } from '@/data/models/result/result';
import { ResultCreateDTO } from '@/data/models/result/result.dto';
import { Scope } from '@/data/models/scope/scope';
import { FunctionResult } from '@/utils/functionResult';
import { EntityNotFoundError } from '../EntityNotFoundError';
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

  async getAll(): Promise<Result[]> {
    return await db.results.orderBy('id').toArray();
  }

  async getAllByWorkerId(workerId: string): Promise<Result[]> {
    return await db.results.where('workerId').equals(workerId).sortBy('taskId');
  }

  async getResultByWorkerIdAndTaskId(
    workerId: string,
    taskId: number,
  ): Promise<FunctionResult<Result, EntityNotFoundError>> {
    const result = await db.results.where({ workerId: workerId, taskId: taskId }).first();
    if (result === undefined) {
      return FunctionResult.err(
        new EntityNotFoundError({ entity: 'Result', id: `${workerId}_${taskId}` }),
      );
    }
    return FunctionResult.ok(result);
  }

  async getByScopeAndWorkerName(
    scope: Scope,
    workerName: string,
  ): Promise<FunctionResult<Result, EntityNotFoundError>> {
    const result = await db.results
      .where({ scopeKey: computeScopeKey(scope), workerName: workerName })
      .first();
    if (result === undefined) {
      return FunctionResult.err(
        new EntityNotFoundError({
          entity: 'Result',
          id: `${computeScopeKey(scope)}_${workerName}`,
        }),
      );
    }
    return FunctionResult.ok(result);
  }
}
