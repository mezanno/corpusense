import { ItemMetadata } from '@/data/models/Metadata';
import { db } from './db';
import { ItemMetadataRepository } from './types';

export class IndexedDBItemMetadataRepository implements ItemMetadataRepository {
  async addMetadata(metadata: ItemMetadata[]): Promise<void> {
    await db.itemMetadata.bulkPut(metadata);
  }

  async getByArk(ark: string): Promise<ItemMetadata[]> {
    return await db.itemMetadata.filter((itemMD) => itemMD.id.includes(ark)).toArray();
  }
}
