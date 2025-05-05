import { StoredItem } from '@/data/models/StoredItem';
import { db } from './db';
import { StoredItemRepository } from './types';

export class IndexedDBStoredItemRepository implements StoredItemRepository {
  async getAll(): Promise<StoredItem[]> {
    return db.storedItems.toArray();
  }
}
