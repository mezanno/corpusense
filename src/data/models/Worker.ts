import { PluginParams } from '@/state/reducers/workers';

export enum WorkerStatus {
  WAITING = 'waiting', // Worker is waiting to be processed
  INPROGRESS = 'inprogress', // Worker is currently being processed
  UNFINISHED = 'unfinished', // Worker has been processed but not completed
  COMPLETED = 'completed', // Worker has been successfully completed
  ERROR = 'error', // Worker encountered an error during processing
}

export interface Worker {
  id: string;
  name: string;
  scope: WorkerScope;
  scopeKey: string; //needed for indexeddb
  status: WorkerStatus;
  createdAt: Date;
  params: PluginParams;
}

export interface WorkerCreateDTO {
  name: string;
  scope: WorkerScope;
  params: PluginParams;
}

export function isWorker(obj: Worker | WorkerCreateDTO): obj is Worker {
  return 'id' in obj && 'scopeKey' in obj && 'status' in obj && 'createdAt' in obj;
}

export type CollectionScope = { collectionId: string };
export type CanvasScope = { canvasId: string; collectionId: string };
export type AnnotationScope = { annotationId: string };
export type WorkerScope = CollectionScope | CanvasScope | AnnotationScope;

export function isCollectionScope(scope: WorkerScope): scope is CollectionScope {
  return 'collectionId' in scope && !('canvasId' in scope);
}

export function isCanvasScope(scope: WorkerScope): scope is CanvasScope {
  return 'collectionId' in scope && 'canvasId' in scope;
}

export function isAnnotationScope(scope: WorkerScope): scope is AnnotationScope {
  return 'annotationId' in scope;
}

export function isSameScope(s1: WorkerScope, s2: WorkerScope): boolean {
  if (isCollectionScope(s1) && isCollectionScope(s2)) {
    return s1.collectionId === s2.collectionId;
  }
  if (isCanvasScope(s1) && isCanvasScope(s2)) {
    return s1.canvasId === s2.canvasId && s1.collectionId === s2.collectionId;
  }
  if (isAnnotationScope(s1) && isAnnotationScope(s2)) {
    return s1.annotationId === s2.annotationId;
  }
  return false;
}
