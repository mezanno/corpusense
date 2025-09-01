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
  getAnnotationsByScope(scope: Scope): Promise<Annotation[]>;
  getAnnotationsByScopeAndType(scope: Scope, types: ElementType[]): Promise<Annotation[]>;
  saveAllAnnotations(annotations: AnnotationDTO[]): Promise<Annotation[]>;
  removeAllById(ids: string[]): Promise<string[]>;
  removeById(id: string): Promise<void>;
  removeByScope(scope: Scope): Promise<string[]>;
  removeByScopeAndType(scope: Scope, types: ElementType[]): Promise<string[]>;
  updateAnnotation(annotation: Annotation): Promise<void>;
  updateOrder(annotationId: string, order: number): Promise<void>;
}

export interface CollectionRepository {
  getAll(): Promise<CollectionDetails[]>;
  getCollectionById(id: string): Promise<Collection>;
  getTagsByCollectionId(collectionId: string): Promise<Tag[]>;
  getCanvasesByCollectionId(collectionId: string): Promise<Canvas[]>;
  getCanvasInCollectionById(canvasId: string, collectionId: string): Promise<Canvas>;
  insertCollection(collection: Collection): Promise<void>;
  saveCollectionContent(collection: Collection): Promise<void>;
  update(
    id: string,
    { name, tags, content }: { name: string; tags: string[]; content: CollectionElement[] },
  ): Promise<void>;
  updateTags(id: string, tags: string[]): Promise<void>;
  remove(collectionToRemove: Collection): Promise<void>;
  removeElement(collectionId: string, canvasId: string): Promise<Collection>;
}

export interface ItemMetadataRepository {
  addMetadata(metadata: ItemMetadata[]): Promise<void>;
  getByArk(ark: string): Promise<ItemMetadata[]>;
}

export interface ManifestRepository {
  exists(id: string): Promise<boolean>;
  getCanvasById(manifestId: string, canvasId: string): Promise<Canvas>;
  getCanvasByIds(manifestId: string, canvasId: string[]): Promise<Canvas[]>;
  getManifestById(manifestId: string): Promise<Manifest>;
  getManifestDetailsByIds(manifestIds: string[]): Promise<StoredManifestDetails[]>;
  loadMetadataForManifest(manifestId: string): Promise<ItemMetadataAttribute[]>;
  saveManifest(manifest: Manifest): Promise<void>;
  addToHistory(url: string): Promise<History>;
  removeFromHistory(url: string): Promise<void>;
  getHistory(): Promise<History[]>;
}

export interface TagRepository {
  getTagsByIds(ids: string[]): Promise<Tag[]>;
  getAllTags(): Promise<Tag[]>;
  createTag(tag: Tag): Promise<Tag>;
  saveTags(tags: Tag[]): Promise<void>;
}

export interface ModelRepository {
  getById(id: string): Promise<DataModel>;
  getAll(): Promise<DataModel[]>;
  getByName(name: string): Promise<DataModel | null>;
  add(model: DataModel): Promise<void>;
  update(model: DataModel): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface NamedEntityRepository {
  getByAnnotationId(annotationId: string): Promise<NamedEntity[]>;
  getNamedEntitiesByAnnotationsIds(annotationIds: string[]): Promise<NamedEntity[]>;
  add(entity: NamedEntity): Promise<void>;
  removeByAnnotationIds(annotationIds: string[]): Promise<void>;
}

export interface ResultRepository {
  addResult(result: ResultCreateDTO): Promise<Result>;
  patch(id: number, changes: Partial<Result>): Promise<void>;
  selectAll(): Promise<Result[]>;
  selectByWorkerName(workerName: string): Promise<Result[]>;
  selectByWorkerId(workerId: string): Promise<Result[]>;
  selectByScopeAndWorkerName(scope: Scope, workerName: string): Promise<Result>;
}

export interface WorkerRepository {
  add(worker: Worker): Promise<Worker>;
  delete(workerId: string): Promise<void>;
  deleteByScope(scope: Scope): Promise<void>;
  update(worker: Worker): Promise<void>;
  patch(id: string, changes: Partial<Worker>): Promise<void>;
  selectAll(): Promise<Worker[]>;
  selectByNameAndScope(workerName: string, scope: Scope): Promise<Worker | undefined>;
}
