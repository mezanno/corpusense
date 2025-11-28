import { Collection, CollectionDetails } from '@/data/models/Collection';
import { DataModel } from '@/data/models/DataModel';

export interface CollectionLiveRepository {
  getAllDetails(): () => Promise<CollectionDetails[]>;
  getById(id: string): () => Promise<Collection>;
}

export interface ModelLiveRepository {
  getById(id: string): () => Promise<DataModel>;
  getAll(): () => Promise<DataModel[]>;
}
