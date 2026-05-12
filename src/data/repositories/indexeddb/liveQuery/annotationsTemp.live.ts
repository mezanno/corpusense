import { Annotation } from '@/data/models/Annotation';
import { isAnnotationScope, isCanvasScope, Scope } from '@/data/models/Scope';
import { db } from '../db';
import { AnnotationTempLiveRepository } from './types.live';

export class IndexedDBAnnotationTempLiveRepository implements AnnotationTempLiveRepository {
  getByScope(scope: Scope): () => Promise<Annotation[]> {
    if (isAnnotationScope(scope)) {
      return async () => {
        const item = await db.annotationsTemp.get(scope.annotationId);
        return item ? [item] : [];
      };
    } else if (isCanvasScope(scope)) {
      return () =>
        db.annotationsTemp
          .where({
            canvasId: scope.canvasId,
            collectionId: scope.collectionId,
          })
          .sortBy('order');
    } else {
      return () =>
        db.annotationsTemp.where('collectionId').equals(scope.collectionId).sortBy('order');
    }
  }
}
