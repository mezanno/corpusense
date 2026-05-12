import { DataModel } from '@/data/models/DataModel';
import i18n from '@/i18n';
import { db } from './db';
import { ModelRepository } from './types';

export class IndexedDBModelRepository implements ModelRepository {
  async getAll(): Promise<DataModel[]> {
    return await db.models.orderBy('name').toArray();
  }
  async getById(id: string): Promise<DataModel> {
    const result = await db.models.get(id);
    if (result === undefined) {
      throw new Error(i18n.t('error_model_undefined'));
    }
    return result;
  }

  async getByName(name: string): Promise<DataModel | null> {
    const models = await db.models.where('name').equals(name).toArray();
    return models.length > 0 ? models[0] : null;
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
