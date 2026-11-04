import { Scope } from '@/data/models/scope/scope';
import { isAnnotationScope, isCanvasScope } from '@/data/models/scope/scope.utils';

export function computeScopeKey(scope: Scope): string {
  if (isAnnotationScope(scope)) {
    return scope.annotationId;
  } else if (isCanvasScope(scope)) {
    return `${scope.collectionId}-${scope.canvasId}`;
  } else {
    return scope.collectionId;
  }
}
