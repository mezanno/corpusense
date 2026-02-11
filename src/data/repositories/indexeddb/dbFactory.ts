import { IndexedDBAnnotationRepository } from './annotations';
import { IndexedDBAnnotationTempRepository } from './annotationsTemp';
import { IndexedDBCollectionRepository } from './collections';
import { IndexedDBConvertedFileRepository } from './convertedFile';
import { IndexedDBFSHandleRepository } from './fsHandle';
import { IndexedDBItemMetadataRepository } from './itemMetadata';
import { IndexedDBAnnotationLiveRepository } from './liveQuery/annotations.live';
import { IndexedDBAnnotationTempLiveRepository } from './liveQuery/annotationsTemp.live';
import { IndexedDBCollectionLiveRepository } from './liveQuery/collections.live';
import { IndexedDBConvertedFileLiveRepository } from './liveQuery/convertedFile.live';
import { IndexedDBManifestLiveRepository } from './liveQuery/manifests.live';
import { IndexedDBModelLiveRepository } from './liveQuery/models.live';
import { IndexedDBNamedEntityLiveRepository } from './liveQuery/namedEntity.live';
import { IndexedDBResultLiveRepository } from './liveQuery/results.live';
import { IndexedDBTagLiveRepository } from './liveQuery/tags.live';
import { IndexedDBWorkerLiveRepository } from './liveQuery/workers.live';
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

export function getAnnotationTempRepository() {
  return new IndexedDBAnnotationTempRepository();
}

export function getAnnotationTempLiveRepository() {
  return new IndexedDBAnnotationTempLiveRepository();
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

export function getTagLiveRepository() {
  return new IndexedDBTagLiveRepository();
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

export function getNamedEntityLiveRepository() {
  return new IndexedDBNamedEntityLiveRepository();
}

export function getResultRepository() {
  return new IndexedDBResultRepository();
}

export function getResultLiveRepository() {
  return new IndexedDBResultLiveRepository();
}

export function getWorkerRepository() {
  return new IndexedDBWorkerRepository();
}

export function getWorkerLiveRepository() {
  return new IndexedDBWorkerLiveRepository();
}

export function getFSHandleRepository() {
  return new IndexedDBFSHandleRepository();
}

export function getConvertedFileRepository() {
  return new IndexedDBConvertedFileRepository();
}

export function getConvertedFileLiveRepository() {
  return new IndexedDBConvertedFileLiveRepository();
}
