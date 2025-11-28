import { Collection, CollectionDetails } from '@/data/models/Collection';
import { db } from '../db';
import { CollectionLiveRepository } from './types.live';

export class IndexedDBCollectionLiveRepository implements CollectionLiveRepository {
  getAllDetails(): () => Promise<CollectionDetails[]> {
    return () => db.collections.toArray();
  }

  getById(id: string): () => Promise<Collection> {
    return async () => {
      const details = await db.collections.get(id);
      if (details === undefined) {
        throw new Error(`Collection with id ${id} not found`);
      }
      const content = await db.collectionContents.get(id);

      return { ...details, content: content?.content || [] };
    };
  }
}
