import { Annotation, ElementType } from '@/data/models/Annotation';
import { Collection, CollectionDetails } from '@/data/models/Collection';
import { ConvertedFile } from '@/data/models/ConvertedFile';
import { DataModel } from '@/data/models/DataModel';
import { History } from '@/data/models/History';
import { ModifierChainDTO } from '@/data/models/modifiers/Modifier';
import { NamedEntity } from '@/data/models/NamedEntity';
import { Result } from '@/data/models/Result';
import { CanvasScope, CollectionScope, Scope } from '@/data/models/Scope';
import { StoredManifestDetails } from '@/data/models/StoredManifest';
import { Tag } from '@/data/models/Tag';
import { Worker } from '@/data/models/Worker';
import { Canvas } from '@iiif/presentation-3';

export interface CollectionLiveRepository {
  getAllDetails(): () => Promise<CollectionDetails[]>;
  getAllDetailsByIds(ids: string[]): () => Promise<CollectionDetails[]>;
  getById(id: string): () => Promise<Collection>;
  getCanvasesByCollectionId(collectionId: string): () => Promise<Canvas[]>;
}

export interface ModelLiveRepository {
  getById(id: string): () => Promise<DataModel>;
  getAll(): () => Promise<DataModel[]>;
}

export interface AnnotationLiveRepository {
  getByScope(scope: Scope): () => Promise<Annotation[]>;
  hasOcrAnnotations(scope: CanvasScope | CollectionScope): () => Promise<boolean>;
  getByScopeAndType(scope: CanvasScope, type: ElementType): () => Promise<Annotation[]>;
}

export interface AnnotationTempLiveRepository {
  getByScope(scope: Scope): () => Promise<Annotation[]>;
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

export interface WorkerLiveRepository {
  getById(id: string): () => Promise<Worker>;
  getAll(): () => Promise<Worker[]>;
  hasResult(scope: CanvasScope | CollectionScope, workerName: string): () => Promise<boolean>;
}

export interface ResultLiveRepository {
  getAll(): () => Promise<Result[]>;
}

export interface ConvertedFileLiveRepository {
  getAll(): () => Promise<ConvertedFile[]>;
}

export interface ModifierChainLiveRepository {
  getAll(): () => Promise<ModifierChainDTO[]>;
}
