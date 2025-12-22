import { Result } from '@/data/models/Result';
import { db } from '../db';
import { ResultLiveRepository } from './types.live';

export class IndexedDBResultLiveRepository implements ResultLiveRepository {
  getAll(): () => Promise<Result[]> {
    return () => db.results.orderBy('id').toArray();
  }
}
