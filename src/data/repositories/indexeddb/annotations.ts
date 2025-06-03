import i18next from 'i18next';
import { Annotation, ElementType, getAnnotationType } from '../../models/Annotation';
import { db } from './db';
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

  async getAnnotationsForCanvasByType(canvasId: string, collectionId: string, type: ElementType) {
    // return db.annotations
    //   .where({
    //     canvasId,
    //     collectionId,
    //   })
    //   .sortBy('order');
    const canvasAnnotations = await this.getAnnotationsForCanvas(canvasId, collectionId);
    return canvasAnnotations.filter((annotation) => getAnnotationType(annotation) === type);
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

  async removeById(id: string): Promise<string[]> {
    const annotation = await db.annotations.get(id);
    if (annotation === undefined) {
      throw new Error(i18next.t('error_annotation_not_found'));
    }
    await db.annotations.delete(id);
    return [id];
  }

  async removeAllById(ids: string[]): Promise<string[]> {
    await db.annotations.bulkDelete(ids);
    return ids;
  }

  async removeByCollectionId(collectionId: string) {
    const annotations = await db.annotations.where('collectionId').equals(collectionId).toArray();
    await db.annotations.where('collectionId').equals(collectionId).delete();
    return annotations.map((annotation) => annotation.id);
  }

  async removeByCanvasId(canvasId: string, collectionId: string) {
    const annotations = await db.annotations
      .where({
        canvasId,
        collectionId,
      })
      .toArray();
    const ids = annotations.map((annotation) => annotation.id);
    await db.annotations.where('[canvasId+collectionId]').equals([canvasId, collectionId]).delete();
    return ids;
  }
}
