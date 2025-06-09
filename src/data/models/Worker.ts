export enum WorkerStatus {
  INPROGRESS = 'inprogress',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export interface Worker {
  id: string;
  name: string;
  scope: WorkerScope;
  status: WorkerStatus;
  createdAt: Date;
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
