import { isAnnotationScope, isCanvasScope, isCollectionScope, Scope } from '@/data/models/Scope';
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
    const canvasAnnotations = await this.getAnnotationsForCanvas(canvasId, collectionId);
    return canvasAnnotations.filter((annotation) => getAnnotationType(annotation) === type);
  }

  async getAnnotationsForCollection(collectionId: string) {
    return await db.annotations.where('collectionId').equals(collectionId).toArray();
  }

  async saveAllAnnotations(annotations: Annotation[]) {
    await db.annotations.bulkPut(annotations);
  }

  async updateAnnotation(annotation: Annotation) {
    await db.annotations.put(annotation);
  }

  async updateOrder(annotationId: string, order: number) {
    await db.annotations.update(annotationId, { order });
  }

  async removeAllById(ids: string[]): Promise<string[]> {
    await db.annotations.bulkDelete(ids);
    return ids;
  }

  async removeByScope(scope: Scope): Promise<string[]> {
    if (isAnnotationScope(scope)) {
      return this.removeAllById([scope.annotationId]);
    } else if (isCanvasScope(scope)) {
      const annotations = await this.getAnnotationsForCanvas(scope.canvasId, scope.collectionId);
      return this.removeAllById(annotations.map((annotation) => annotation.id));
    } else if (isCollectionScope(scope)) {
      const annotations = await this.getAnnotationsForCollection(scope.collectionId);
      return this.removeAllById(annotations.map((annotation) => annotation.id));
    }
    return [];
  }
}
