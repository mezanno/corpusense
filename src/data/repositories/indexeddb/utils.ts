import { isCanvasScope, isCollectionScope, Scope } from '@/data/models/Scope';

export function getScopeKey(scope: Scope): string {
  if (isCanvasScope(scope)) {
    return `${scope.collectionId}-${scope.canvasId}`;
  } else if (isCollectionScope(scope)) {
    return `${scope.collectionId}`;
  } else {
    return `${scope.annotationId}`;
  }
}
