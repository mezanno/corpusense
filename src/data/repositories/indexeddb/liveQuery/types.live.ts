import { Collection, CollectionDetails } from '@/data/models/Collection';

export interface CollectionLiveRepository {
  getAllDetails(): () => Promise<CollectionDetails[]>;
  getById(id: string): () => Promise<Collection>;
}
