export type CollectionScope = { collectionId: string };
export type CanvasScope = { canvasId: string; collectionId: string };
export type AnnotationScope = { annotationId: string };
export type Scope = CollectionScope | CanvasScope | AnnotationScope;

export function isCollectionScope(scope: Scope): scope is CollectionScope {
  return 'collectionId' in scope && !('canvasId' in scope);
}

export function isCanvasScope(scope: Scope): scope is CanvasScope {
  return 'collectionId' in scope && 'canvasId' in scope;
}

export function isAnnotationScope(scope: Scope): scope is AnnotationScope {
  return 'annotationId' in scope;
}

export function isSameScope(s1: Scope, s2: Scope): boolean {
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
