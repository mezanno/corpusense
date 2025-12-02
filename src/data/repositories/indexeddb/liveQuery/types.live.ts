import { Annotation } from '@/data/models/Annotation';
import { Collection, CollectionDetails } from '@/data/models/Collection';
import { DataModel } from '@/data/models/DataModel';
import { History } from '@/data/models/History';
import { NamedEntity } from '@/data/models/NamedEntity';
import { CanvasScope, Scope } from '@/data/models/Scope';
import { StoredManifestDetails } from '@/data/models/StoredManifest';
import { Tag } from '@/data/models/Tag';
import { Canvas } from '@iiif/presentation-3';

export interface CollectionLiveRepository {
  getAllDetails(): () => Promise<CollectionDetails[]>;
  getById(id: string): () => Promise<Collection>;
  getCanvasesByCollectionId(collectionId: string): () => Promise<Canvas[]>;
}

export interface ModelLiveRepository {
  getById(id: string): () => Promise<DataModel>;
  getAll(): () => Promise<DataModel[]>;
}

export interface AnnotationLiveRepository {
  getByScope(scope: Scope): () => Promise<Annotation[]>;
  hasOcrAnnotations(scope: CanvasScope): () => Promise<boolean>;
}

export interface ManifestLiveRepository {
  getHistoryEntries(): () => Promise<History[]>;
  getDetailsByManifestIds(manifestIds: string[]): () => Promise<StoredManifestDetails[]>;
}

export interface TagLiveRepository {
  getAll(): () => Promise<Tag[]>;
}

export interface NamedEntityLiveRepository {
  getByAnnotationIds(annotationIds: string[]): () => Promise<NamedEntity[]>;
}
