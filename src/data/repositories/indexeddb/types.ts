import { Annotation, AnnotationDTO, ElementType } from '@/data/models/Annotation';
import { Collection, CollectionDetails } from '@/data/models/Collection';
import { CollectionElement } from '@/data/models/CollectionElement';
import { DataModel } from '@/data/models/DataModel';
import { History } from '@/data/models/History';
import { ItemMetadata, ItemMetadataAttribute } from '@/data/models/Metadata';
import { NamedEntity } from '@/data/models/NamedEntity';
import { Result, ResultCreateDTO } from '@/data/models/Result';
import { Scope } from '@/data/models/Scope';
import { StoredManifestDetails } from '@/data/models/StoredManifest';
import { Tag } from '@/data/models/Tag';
import { Worker } from '@/data/models/Worker';
import { Canvas, Manifest } from '@iiif/presentation-3';

export interface AnnotationRepository {
  getById(id: string): Promise<Annotation>;
  getByScope(scope: Scope): Promise<Annotation[]>;
  getByScopeAndTypes(scope: Scope, types: ElementType[]): Promise<Annotation[]>;
  getNextOrderByScopeAndType(scope: Scope, type: ElementType): Promise<number>;

  addAll(annotations: AnnotationDTO[]): Promise<Annotation[]>;

  deleteById(id: string): Promise<void>;
  deleteByIds(ids: string[]): Promise<string[]>;
  deleteByScope(scope: Scope): Promise<string[]>;
  deleteByScopeAndType(scope: Scope, types: ElementType[]): Promise<string[]>;

  update(annotation: Annotation): Promise<Annotation[]>;
  updateOrder(annotationId: string, order: number): Promise<Annotation[]>;
}

export interface CollectionRepository {
  getAllDetails(): Promise<CollectionDetails[]>;
  getById(id: string): Promise<Collection>;
  getTagsByCollectionId(collectionId: string): Promise<Tag[]>;
  getCanvasesByCollectionId(collectionId: string): Promise<Canvas[]>;
  getCanvasById(canvasId: string, collectionId: string): Promise<Canvas>;

  create(collection: Collection): Promise<void>;
  addContentToCollection(collection: Collection): Promise<void>;

  update(
    id: string,
    { name, tags, content }: { name: string; tags: string[]; content: CollectionElement[] },
  ): Promise<void>;
  updateTags(id: string, tags: string[]): Promise<void>;

  delete(collectionToRemove: Collection): Promise<void>;
  deleteElement(collectionId: string, canvasId: string): Promise<Collection>;
}

export interface ItemMetadataRepository {
  addAll(metadata: ItemMetadata[]): Promise<void>;
  getByArk(ark: string): Promise<ItemMetadata[]>;
}

export interface ManifestRepository {
  exists(id: string): Promise<boolean>;

  getCanvasById(manifestId: string, canvasId: string): Promise<Canvas>;
  getCanvasesByIds(manifestId: string, canvasId: string[]): Promise<Canvas[]>;
  getById(manifestId: string): Promise<Manifest>;
  getDetailsByManifestIds(manifestIds: string[]): Promise<StoredManifestDetails[]>;
  getMetadata(manifestId: string): Promise<ItemMetadataAttribute[]>;
  getHistoryEntries(): Promise<History[]>;

  add(manifest: Manifest): Promise<void>;
  addToHistory(url: string): Promise<History>;

  deleteFromHistory(url: string): Promise<void>;
}

export interface TagRepository {
  getByIds(ids: string[]): Promise<Tag[]>;
  getAll(): Promise<Tag[]>;

  add(tag: Tag): Promise<Tag>;
  addAll(tags: Tag[]): Promise<void>;
}

export interface ModelRepository {
  getById(id: string): Promise<DataModel>;
  getAll(): Promise<DataModel[]>;
  getByName(name: string): Promise<DataModel | null>;

  add(model: DataModel): Promise<void>;

  update(model: DataModel): Promise<void>;

  deleteById(id: string): Promise<void>;
}

export interface NamedEntityRepository {
  getByAnnotationId(annotationId: string): Promise<NamedEntity[]>;
  getByAnnotationIds(annotationIds: string[]): Promise<NamedEntity[]>;

  add(entity: NamedEntity): Promise<void>;

  deleteByAnnotationIds(annotationIds: string[]): Promise<void>;
}

export interface ResultRepository {
  getAll(): Promise<Result[]>;
  getAllByWorkerName(workerName: string): Promise<Result[]>;
  getAllByWorkerId(workerId: string): Promise<Result[]>;
  getByScopeAndWorkerName(scope: Scope, workerName: string): Promise<Result>;

  add(result: ResultCreateDTO): Promise<Result>;

  patch(id: number, changes: Partial<Result>): Promise<void>;
}

export interface WorkerRepository {
  getAll(): Promise<Worker[]>;
  getByNameAndScope(workerName: string, scope: Scope): Promise<Worker | undefined>;

  add(worker: Worker): Promise<Worker>;

  update(worker: Worker): Promise<void>;
  patch(id: string, changes: Partial<Worker>): Promise<void>;

  deleteById(workerId: string): Promise<void>;
  deleteByScope(scope: Scope): Promise<void>;
}
