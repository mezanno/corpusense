import { isAnnotationScope, isCanvasScope, Scope } from '@/data/models/Scope';

export function computeScopeKey(scope: Scope): string {
  if (isAnnotationScope(scope)) {
    // return `${scope.collectionId}-${scope.canvasId}-${scope.annotationId}`;
    return scope.annotationId;
  } else if (isCanvasScope(scope)) {
    return `${scope.collectionId}-${scope.canvasId}`;
  } else {
    return scope.collectionId;
  }
}
