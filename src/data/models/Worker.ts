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
