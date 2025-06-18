import { isCanvasScope, isCollectionScope, WorkerScope } from './Worker';

export interface Result {
  id: number;
  scope: WorkerScope;
  scopeKey: string; //needed for indexeddb
  workerName: string;
  value: object | string;
}

export interface ResultCreateDTO {
  scope: WorkerScope;
  workerName: string;
  value: object | string;
}

export function getScopeKey(scope: WorkerScope): string {
  if (isCanvasScope(scope)) {
    return `${scope.collectionId}-${scope.canvasId}`;
  } else if (isCollectionScope(scope)) {
    return `${scope.collectionId}`;
  } else {
    return `${scope.annotationId}`;
  }
}
