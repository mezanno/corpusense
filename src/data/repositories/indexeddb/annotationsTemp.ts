import { Annotation } from '@/data/models/Annotation';
import { CanvasScope } from '@/data/models/Scope';
import { db } from './db';
import { AnnotationTempRepository } from './types';

export class IndexedDBAnnotationTempRepository implements AnnotationTempRepository {
  async getAll(): Promise<Annotation[]> {
    return await db.annotationsTemp.toArray();
  }

  async getByCanvas(scope: CanvasScope): Promise<Annotation[]> {
    return db.annotationsTemp
      .where({
        canvasId: scope.canvasId,
        collectionId: scope.collectionId,
      })
      .sortBy('order');
  }

  async addAll(annotations: Annotation[]): Promise<Annotation[]> {
    await db.annotationsTemp.bulkAdd(annotations);
    return annotations;
  }

  async deleteByCollection(collectionId: string): Promise<void> {
    const toDelete = await db.annotationsTemp.where('collectionId').equals(collectionId).toArray();
    const idsToDelete = toDelete.map((a) => a.id);
    await db.annotationsTemp.bulkDelete(idsToDelete);
  }
}
