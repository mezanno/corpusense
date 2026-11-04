import { DataModel } from '@/data/models/dataModel/dataModel';
import { db } from '../db';
import { ModelLiveRepository } from './types.live';

export class IndexedDBModelLiveRepository implements ModelLiveRepository {
  getAll(): () => Promise<DataModel[]> {
    return () => db.models.orderBy('name').toArray();
  }
}
