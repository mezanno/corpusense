import { IndexedDBAnnotationRepository } from './annotations';
import { IndexedDBCollectionRepository } from './collections';
import { IndexedDBItemMetadataRepository } from './itemMetadata';
import { IndexedDBManifestRepository } from './manifest';
import { IndexedDBModelRepository } from './models';
import { IndexedDBNamedEntityRepository } from './namedEntities';
import { IndexedDBResultRepository } from './results';
import { IndexedDBTagRepository } from './tags';
import { IndexedDBWorkerRepository } from './workers';

export function getAnnotationRepository() {
  return new IndexedDBAnnotationRepository();
}

export function getCollectionRepository() {
  return new IndexedDBCollectionRepository();
}

export function getManifestRepository() {
  return new IndexedDBManifestRepository();
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

export function getNamedEntityRepository() {
  return new IndexedDBNamedEntityRepository();
}

export function getResultRepository() {
  return new IndexedDBResultRepository();
}

export function getWorkerRepository() {
  return new IndexedDBWorkerRepository();
}
