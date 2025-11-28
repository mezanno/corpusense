import { DataModel } from '@/data/models/DataModel';
import i18next from 'i18next';
import { db } from '../db';
import { ModelLiveRepository } from './types.live';

export class IndexedDBModelLiveRepository implements ModelLiveRepository {
  getById(id: string): () => Promise<DataModel> {
    return async () => {
      const result = await db.models.get(id);
      if (result === undefined) {
        throw new Error(i18next.t('error_model_undefined'));
      }
      return result;
    };
  }

  getAll(): () => Promise<DataModel[]> {
    return () => db.models.toArray();
  }
}
