import { Tag } from '@/data/models/Tag';
import { db } from '../db';
import { TagLiveRepository } from './types.live';

export class IndexedDBTagLiveRepository implements TagLiveRepository {
  getAll(): () => Promise<Tag[]> {
    return () => db.tags.toArray();
  }
}
