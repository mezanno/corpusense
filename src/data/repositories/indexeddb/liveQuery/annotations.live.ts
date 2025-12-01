import { Annotation } from '@/data/models/Annotation';
import { isAnnotationScope, isCanvasScope, Scope } from '@/data/models/Scope';
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
}
