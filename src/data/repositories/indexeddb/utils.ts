import { isCanvasScope, isCollectionScope, WorkerScope } from '@/data/models/Worker';

export function getScopeKey(scope: WorkerScope): string {
  if (isCanvasScope(scope)) {
    return `${scope.collectionId}-${scope.canvasId}`;
  } else if (isCollectionScope(scope)) {
    return `${scope.collectionId}`;
  } else {
    return `${scope.annotationId}`;
  }
}
