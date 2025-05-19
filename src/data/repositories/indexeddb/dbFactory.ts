import { IndexedDBAnnotationRepository } from './annotations';
import { IndexedDBCanvasRepository } from './canvas';
import { IndexedDBCollectionRepository } from './collections';
import { IndexedDBItemMetadataRepository } from './itemMetadata';
import { IndexedDBManifestRepository } from './manifest';
import { IndexedDBModelRepository } from './models';
import { IndexedDBStoredItemRepository } from './storedItem';
import { IndexedDBTagRepository } from './tags';

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

export function getCanvasRepository() {
  return new IndexedDBCanvasRepository();
}

export function getItemMetadataRepository() {
  return new IndexedDBItemMetadataRepository();
}

export function getStoredItemRepository() {
  return new IndexedDBStoredItemRepository();
}

export function getModelRepository() {
  return new IndexedDBModelRepository();
}
