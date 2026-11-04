import { DataModel } from '@/data/models/dataModel/dataModel';
import { FunctionResult } from '@/utils/functionResult';
import { EntityNotFoundError } from '../EntityNotFoundError';
import { db } from './db';
import { ModelRepository } from './types';

export class IndexedDBModelRepository implements ModelRepository {
  async getAll(): Promise<DataModel[]> {
    return await db.models.orderBy('name').toArray();
  }

  async getById(id: string): Promise<FunctionResult<DataModel, EntityNotFoundError>> {
    const result = await db.models.get(id);
    if (result === undefined) {
      return FunctionResult.err(new EntityNotFoundError({ entity: 'DataModel', id }));
    }
    return FunctionResult.ok(result);
  }

  async getByName(name: string): Promise<FunctionResult<DataModel, EntityNotFoundError>> {
    const models = await db.models.where('name').equals(name).toArray();
    if (models.length === 0) {
      return FunctionResult.err(new EntityNotFoundError({ entity: 'DataModel', id: name }));
    }
    return FunctionResult.ok(models[0]);
  }

  async add(model: DataModel): Promise<void> {
    await db.models.add(model);
  }

  async update(model: DataModel): Promise<void> {
    await db.models.put(model);
  }

  async deleteById(id: string): Promise<void> {
    await db.models.delete(id);
  }
}
