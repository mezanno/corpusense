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

  async getAnnotationsByScope(scope: Scope): Promise<Annotation[]> {
    if (isAnnotationScope(scope)) {
      const annotation = await this.getById(scope.annotationId);
      return [annotation];
    } else if (isCanvasScope(scope)) {
      return db.annotations
        .where({
          canvasId: scope.canvasId,
          collectionId: scope.collectionId,
        })
        .sortBy('order');
    } else if (isCollectionScope(scope)) {
      return await db.annotations.where('collectionId').equals(scope.collectionId).toArray();
    }
    return [];
  }

  async getAnnotationsByScopeAndType(scope: Scope, types?: ElementType[]): Promise<Annotation[]> {
    const annotations = await this.getAnnotationsByScope(scope);
    if (types === undefined || types.length === 0) {
      return annotations;
    }
    return annotations.filter((annotation) => types.includes(getAnnotationType(annotation)));
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

  async removeById(id: string): Promise<void> {
    await db.annotations.delete(id);
  }

  async removeByScope(scope: Scope): Promise<string[]> {
    const annotations = await this.getAnnotationsByScope(scope);
    return this.removeAllById(annotations.map((annotation) => annotation.id));
  }

  async removeByScopeAndType(scope: Scope, types?: ElementType[]): Promise<string[]> {
    const annotations = await this.getAnnotationsByScopeAndType(scope, types);
    return this.removeAllById(annotations.map((annotation) => annotation.id));
  }
}
