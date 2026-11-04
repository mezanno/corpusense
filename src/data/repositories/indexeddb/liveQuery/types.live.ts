import { Annotation, ElementType } from '@/data/models/annotations/annotation';
import { Collection, CollectionDetails } from '@/data/models/collection/collection';
import { DataModel } from '@/data/models/dataModel/dataModel';
import { ModifierChainDTO } from '@/data/models/modifiers/Modifier';
import { NamedEntity } from '@/data/models/namedEntity';
import { Project } from '@/data/models/project';
import { Result } from '@/data/models/result/result';
import { CanvasScope, CollectionScope, Scope } from '@/data/models/scope/scope';
import { Source } from '@/data/models/source/source';
import { Tag } from '@/data/models/tag';
import { Worker } from '@/data/models/worker/worker';
import { Canvas } from '@iiif/presentation-3';

export interface CollectionLiveRepository {
  getAllDetails(): () => Promise<CollectionDetails[]>;
  getAllDetailsByIds(ids: string[]): () => Promise<CollectionDetails[]>;
  getById(id: string): () => Promise<Collection | undefined>;
  getCanvasesByCollectionId(
    collectionId: string,
  ): () => Promise<{ canvas: Canvas; sourceId: string }[]>;
}

export interface ModelLiveRepository {
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

export interface SourceLiveRepository {
  getAll(type: string): () => Promise<Source[]>;
}

export interface TagLiveRepository {
  getAll(): () => Promise<Tag[]>;
}

export interface NamedEntityLiveRepository {
  getByAnnotationIds(annotationIds: string[]): () => Promise<NamedEntity[]>;
}

export interface WorkerLiveRepository {
  getAll(): () => Promise<Worker[]>;
  hasResult(scope: CanvasScope | CollectionScope, workerNames: string[]): () => Promise<boolean>;
}

export interface ResultLiveRepository {
  getAll(): () => Promise<Result[]>;
}

export interface ModifierChainLiveRepository {
  getAll(): () => Promise<ModifierChainDTO[]>;
}

export interface ProjectLiveRepository {
  getAll(): () => Promise<Project[]>;
}
