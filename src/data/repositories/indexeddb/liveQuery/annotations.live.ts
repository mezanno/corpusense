import { Annotation, ElementType } from '@/data/models/Annotation';
import { CanvasScope, isAnnotationScope, isCanvasScope, Scope } from '@/data/models/Scope';
import { db } from '../db';
import { AnnotationLiveRepository } from './types.live';

export class IndexedDBAnnotationLiveRepository implements AnnotationLiveRepository {
  getByScope(scope: Scope): () => Promise<Annotation[]> {
    if (isAnnotationScope(scope)) {
      return async () => {
        const item = await db.annotations.get(scope.annotationId);
        return item ? [item] : [];
      };
    } else if (isCanvasScope(scope)) {
      return () =>
        db.annotations
          .where({
            canvasId: scope.canvasId,
            collectionId: scope.collectionId,
          })
          .sortBy('order');
    } else {
      return () => db.annotations.where('collectionId').equals(scope.collectionId).sortBy('order');
    }
  }

  hasOcrAnnotations(scope: CanvasScope): () => Promise<boolean> {
    return () =>
      db.annotations
        .where({
          '[canvasId+collectionId+type]': [
            scope.canvasId,
            scope.collectionId,
            ElementType.TEXT_LINE,
          ],
        })
        .count()
        .then((count) => count > 0);
  }
}
