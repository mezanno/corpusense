import { Source } from '@/data/models/source/source';
import { db } from '../db';
import { SourceLiveRepository } from './types.live';

export class IndexedDBSourceLiveRepository implements SourceLiveRepository {
  getAll(type: string): () => Promise<Source[]> {
    return async () => {
      return await db.sources.where('type').equals(type).toArray();
    };
  }
}
