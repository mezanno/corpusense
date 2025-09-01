import { isAnnotationScope, isCanvasScope, Scope } from '@/data/models/Scope';
import i18next from 'i18next';
import { Annotation, AnnotationDTO, ElementType, getAnnotationType } from '../../models/Annotation';
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
    } else {
      return await db.annotations.where('collectionId').equals(scope.collectionId).sortBy('order');
    }
  }

  async getAnnotationsByScopeAndType(scope: Scope, types?: ElementType[]): Promise<Annotation[]> {
    const annotations = await this.getAnnotationsByScope(scope);
    if (types === undefined || types.length === 0) {
      return annotations;
    }
    return annotations.filter((annotation) => types.includes(getAnnotationType(annotation)));
  }

  async getNextOrderByScopeAndType(scope: Scope, type: ElementType): Promise<number> {
    const annotations = await this.getAnnotationsByScopeAndType(scope, [type]);
    if (annotations.length === 0) {
      return 1;
    }
    return annotations[annotations.length - 1].order + 1;
  }

  async saveAllAnnotations(annotations: AnnotationDTO[]) {
    /* set the order for each annotation. We get the last order for the scope and type, and increment it for each new annotation.
    To optimize it, we order annotations by type and then we loop on each type */
    const newAnnotations: Annotation[] = [];
    const annotationsByType: { [key in ElementType]?: AnnotationDTO[] } = {};
    for (const annotation of annotations) {
      const type = getAnnotationType(annotation);
      if (!annotationsByType[type]) {
        annotationsByType[type] = [];
      }
      annotationsByType[type].push(annotation);
    }
    for (const type in annotationsByType) {
      const elementType = type as ElementType;
      let lastOrder = await this.getNextOrderByScopeAndType(
        { collectionId: annotations[0].collectionId, canvasId: annotations[0].canvasId },
        elementType,
      );

      for (const annotation of annotationsByType[elementType]!) {
        newAnnotations.push({ ...annotation, order: lastOrder });
        lastOrder++;
      }
    }
    await db.annotations.bulkPut(newAnnotations);
    return newAnnotations;
  }

  async updateAnnotation(annotation: Annotation) {
    await db.annotations.put(annotation);
  }

  async updateOrder(annotationId: string, order: number) {
    //TODO: rewrite
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
