import i18next from 'i18next';
import { Annotation } from '../../models/Annotation';
import { db } from './db';
import { getCollectionRepository } from './dbFactory';
import { AnnotationRepository } from './types';

export class IndexedDBAnnotationRepository implements AnnotationRepository {
  async getById(id: string): Promise<Annotation> {
    const annotation = await db.annotations.get(id);
    if (annotation === undefined) {
      throw new Error(i18next.t('error_annotation_not_found'));
    }
    return annotation;
  }

  async getAnnotationsForCanvas(canvasId: string, collectionId: string) {
    return db.annotations
      .where({
        canvasId,
        collectionId,
      })
      .sortBy('order');
  }

  async getAnnotationsForCollection(collectionId: string) {
    return await db.annotations.where('collectionId').equals(collectionId).toArray();
  }

  async saveAllAnnotations(annotations: Annotation[]) {
    for (const annotation of annotations) {
      await db.annotations.put(annotation);
    }
  }

  async updateAnnotation(annotation: Annotation) {
    await db.annotations.put(annotation);
  }

  async updateOrder(annotationId: string, order: number) {
    await db.annotations.update(annotationId, { order });
  }

  async removeById(id: string): Promise<void> {
    const annotation = await db.annotations.get(id);
    if (annotation === undefined) {
      throw new Error(i18next.t('error_annotation_not_found'));
    }
    await db.annotations.delete(id);
  }

  async removeAllAnnotations(collectionId: string) {
    const canvases = await getCollectionRepository().getCanvasesByCollectionId(collectionId);
    const canvasIds = canvases.map((canvas) => canvas.id);
    await db.annotations.where('canvasId').anyOf(canvasIds).delete();
    return canvasIds;
  }
}
