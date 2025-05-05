import { ItemMetadata } from '@/data/models/Metadata';
import { db } from './db';

export class IndexedDBItemMetadataRepository {
  async addMetadata(metadata: ItemMetadata[]): Promise<void> {
    await db.itemMetadata.bulkPut(metadata);
  }

  async getByArk(ark: string): Promise<ItemMetadata[]> {
    return await db.itemMetadata.filter((itemMD) => itemMD.id.includes(ark)).toArray();
  }
}
