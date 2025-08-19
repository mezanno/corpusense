import { StoredItem, StoredItemDetails } from '@/data/models/StoredItem';
import { db } from './db';
import { StoredItemRepository } from './types';

export class IndexedDBStoredItemRepository implements StoredItemRepository {
  async getById(id: string): Promise<StoredItem> {
    const item = await db.storedItems.get(id);
    if (!item) {
      throw new Error(`StoredItem with id ${id} not found.`);
    }
    const content = await db.storedItemContents.get(id);
    if (!content) {
      throw new Error(`Content for StoredItem with id ${id} not found.`);
    }
    return {
      ...item,
      ...content,
    };
  }

  async getAllDetails(): Promise<StoredItemDetails[]> {
    return db.storedItems.toArray();
  }
}
