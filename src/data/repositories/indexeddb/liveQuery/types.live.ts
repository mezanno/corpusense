import { Annotation } from '@/data/models/Annotation';
import { Collection, CollectionDetails } from '@/data/models/Collection';
import { DataModel } from '@/data/models/DataModel';
import { Scope } from '@/data/models/Scope';

export interface CollectionLiveRepository {
  getAllDetails(): () => Promise<CollectionDetails[]>;
  getById(id: string): () => Promise<Collection>;
}

export interface ModelLiveRepository {
  getById(id: string): () => Promise<DataModel>;
  getAll(): () => Promise<DataModel[]>;
}

export interface AnnotationLiveRepository {
  getByScope(scope: Scope): () => Promise<Annotation[]>;
}
