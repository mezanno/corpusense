import { IndexedDBAnnotationRepository } from './annotations';
import { IndexedDBCollectionRepository } from './collections';
import { IndexedDBFSHandleRepository } from './fsHandle';
import { IndexedDBItemMetadataRepository } from './itemMetadata';
import { IndexedDBAnnotationLiveRepository } from './liveQuery/annotations.live';
import { IndexedDBCollectionLiveRepository } from './liveQuery/collections.live';
import { IndexedDBManifestLiveRepository } from './liveQuery/manifests.live';
import { IndexedDBModelLiveRepository } from './liveQuery/models.live';
import { IndexedDBManifestRepository } from './manifest';
import { IndexedDBModelRepository } from './models';
import { IndexedDBNamedEntityRepository } from './namedEntities';
import { IndexedDBResultRepository } from './results';
import { IndexedDBTagRepository } from './tags';
import { IndexedDBWorkerRepository } from './workers';

export function getAnnotationRepository() {
  return new IndexedDBAnnotationRepository();
}

export function getAnnotationLiveRepository() {
  return new IndexedDBAnnotationLiveRepository();
}

export function getCollectionRepository() {
  return new IndexedDBCollectionRepository();
}

export function getCollectonLiveRepository() {
  return new IndexedDBCollectionLiveRepository();
}

export function getManifestRepository() {
  return new IndexedDBManifestRepository();
}

export function getManifestLiveRepository() {
  return new IndexedDBManifestLiveRepository();
}

export function getTagRepository() {
  return new IndexedDBTagRepository();
}

export function getItemMetadataRepository() {
  return new IndexedDBItemMetadataRepository();
}

export function getModelRepository() {
  return new IndexedDBModelRepository();
}

export function getModelLiveRepository() {
  return new IndexedDBModelLiveRepository();
}

export function getNamedEntityRepository() {
  return new IndexedDBNamedEntityRepository();
}

export function getResultRepository() {
  return new IndexedDBResultRepository();
}

export function getWorkerRepository() {
  return new IndexedDBWorkerRepository();
}

export function getFSHandleRepository() {
  return new IndexedDBFSHandleRepository();
}
