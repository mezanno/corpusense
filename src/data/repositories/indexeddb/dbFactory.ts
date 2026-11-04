import { IndexedDBAnnotationRepository } from './annotations';
import { IndexedDBAnnotationTempRepository } from './annotationsTemp';
import { IndexedDBCollectionRepository } from './collections';
import { IndexedDBFSHandleRepository } from './fsHandle';
import { IndexedDBAnnotationLiveRepository } from './liveQuery/annotations.live';
import { IndexedDBAnnotationTempLiveRepository } from './liveQuery/annotationsTemp.live';
import { IndexedDBCollectionLiveRepository } from './liveQuery/collections.live';
import { IndexedDBModelLiveRepository } from './liveQuery/models.live';
import { IndexedDBModifierChainlLiveRepository } from './liveQuery/modifierChain.live';
import { IndexedDBNamedEntityLiveRepository } from './liveQuery/namedEntity.live';
import { IndexedDBProjectLiveRepository } from './liveQuery/projects.live';
import { IndexedDBResultLiveRepository } from './liveQuery/results.live';
import { IndexedDBSourceLiveRepository } from './liveQuery/sources.live';
import { IndexedDBTagLiveRepository } from './liveQuery/tags.live';
import { IndexedDBWorkerLiveRepository } from './liveQuery/workers.live';
import { IndexedDBModelRepository } from './models';
import { IndexedDBModifierChainRepository } from './modifierChain';
import { IndexedDBNamedEntityRepository } from './namedEntities';
import { IndexedDBProjectRepository } from './projects';
import { IndexedDBResultRepository } from './results';
import { IndexedDBSourceRepository } from './sources';
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

export function getCollectionLiveRepository() {
  return new IndexedDBCollectionLiveRepository();
}

export function getSourceRepository() {
  return new IndexedDBSourceRepository();
}

export function getSourceLiveRepository() {
  return new IndexedDBSourceLiveRepository();
}

export function getTagRepository() {
  return new IndexedDBTagRepository();
}

export function getTagLiveRepository() {
  return new IndexedDBTagLiveRepository();
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

export function getModifierChainRepository() {
  return new IndexedDBModifierChainRepository();
}

export function getModifierChainLiveRepository() {
  return new IndexedDBModifierChainlLiveRepository();
}

export function getProjectRepository() {
  return new IndexedDBProjectRepository();
}

export function getProjectLiveRepository() {
  return new IndexedDBProjectLiveRepository();
}
