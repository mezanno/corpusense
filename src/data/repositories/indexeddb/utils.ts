import { isAnnotationScope, isCanvasScope, Scope } from '@/data/models/Scope';

export function getScopeKey(scope: Scope): string {
  if (isAnnotationScope(scope)) {
    return `${scope.annotationId}`;
  } else if (isCanvasScope(scope)) {
    return `${scope.collectionId}-${scope.canvasId}`;
  } else {
    return `${scope.collectionId}`;
  }
}
