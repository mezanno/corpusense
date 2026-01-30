import { isAnnotationScope, isCanvasScope, Scope } from '@/data/models/Scope';
import { ShapeType } from '@annotorious/annotorious';
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

  async getByScope(scope: Scope): Promise<Annotation[]> {
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

  async getByScopeAndTypes(scope: Scope, types?: ElementType[]): Promise<Annotation[]> {
    const annotations = await this.getByScope(scope);
    if (types === undefined || types.length === 0) {
      return annotations;
    }
    return annotations.filter((annotation) => types.includes(getAnnotationType(annotation)));
  }

  async getNextOrderByScopeAndType(scope: Scope, type: ElementType): Promise<number> {
    const annotations = await this.getByScopeAndTypes(scope, [type]);
    if (annotations.length === 0) {
      return 1;
    }
    return annotations[annotations.length - 1].order + 1;
  }

  //TODO! il faut ordonner les annotations par collection et canvas sinon l'ordre sera faux
  async addAll(annotations: AnnotationDTO[]) {
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

  async update(annotation: Annotation) {
    const annotationToUpdate = await db.annotations.get(annotation.id);

    const annotationsUpdated: Annotation[] = [];
    if (annotationToUpdate !== undefined) {
      /*
      if the annotation already exists, we need to check if the type changed.
      If the type changed, we need to update the order of the annotation and the order of the annotations above it.
      */
      const actualType = getAnnotationType(annotationToUpdate);
      const newType = getAnnotationType(annotation);
      if (actualType !== newType) {
        //type changed, we need to update the order
        const newOrder = await this.getNextOrderByScopeAndType(
          { collectionId: annotation.collectionId, canvasId: annotation.canvasId },
          newType,
        );
        annotation.order = newOrder;

        //we need to update the order of the annotations above the old order

        const annotationsToUpdate = await db.annotations
          .where('[canvasId+collectionId]')
          .equals([annotation.canvasId, annotation.collectionId])
          .filter((a) => a.order > annotationToUpdate.order && getAnnotationType(a) === actualType)
          .sortBy('order');
        for (let i = 0; i < annotationsToUpdate.length; i++) {
          const a = annotationsToUpdate[i];
          annotationsUpdated.push({ ...a, order: a.order - 1 });
        }
      }
    }
    annotationsUpdated.push(annotation);

    await db.transaction('rw', db.annotations, async () => {
      await db.annotations.bulkPut(annotationsUpdated);
    });

    return annotationsUpdated;
  }

  async updateOrder(annotationId: string, order: number) {
    const annotationToUpdate = await db.annotations.get(annotationId);
    if (annotationToUpdate === undefined) {
      throw new Error(i18next.t('error_annotation_not_found'));
    }
    const actualOrder = annotationToUpdate.order;
    const { canvasId, collectionId } = annotationToUpdate;
    const type = getAnnotationType(annotationToUpdate);

    const annotationToSwapWith = await db.annotations
      .where('[canvasId+collectionId]')
      .equals([canvasId, collectionId])
      .filter((a) => a.order === order && getAnnotationType(a) === type)
      .first();

    const updatedAnnotations: Annotation[] = [];
    updatedAnnotations.push({ ...annotationToUpdate, order });
    if (annotationToSwapWith !== undefined) {
      updatedAnnotations.push({ ...annotationToSwapWith, order: actualOrder });
      //swap the order of the two annotations
      await db.transaction('rw', db.annotations, async () => {
        await db.annotations.bulkPut(updatedAnnotations);
      });
    } else {
      //just update the order of the annotation
      await db.annotations.update(annotationId, { order });
    }
    return updatedAnnotations;
  }

  async mergeAnnotations(annotations: Annotation[]): Promise<void> {
    if (annotations.length === 0) {
      return;
    }
    //annotations have to be in the same scope
    const { canvasId } = annotations[0];
    annotations.forEach((annotation) => {
      if (annotation.canvasId !== canvasId) {
        throw new Error(i18next.t('error_annotations_not_in_same_scope'));
      }
    });

    //annotations have to be of type TEMP
    annotations.forEach((annotation) => {
      if (getAnnotationType(annotation) !== ElementType.TEMP) {
        throw new Error(i18next.t('error_annotations_not_of_type_temp'));
      }
    });

    //create the new annotation
    //compute the new target by merging the bounds of the annotations
    const mergedTarget = annotations.reduce(
      (acc, a) => {
        const selector = a.target.selector;
        if (selector.type === ShapeType.RECTANGLE) {
          const geometry = selector.geometry;
          acc = {
            bounds: {
              minX: Math.min(acc.bounds.minX, geometry.bounds.minX),
              minY: Math.min(acc.bounds.minY, geometry.bounds.minY),
              maxX: Math.max(acc.bounds.maxX, geometry.bounds.maxX),
              maxY: Math.max(acc.bounds.maxY, geometry.bounds.maxY),
            },
            h:
              Math.max(acc.bounds.maxY, geometry.bounds.maxY) -
              Math.min(acc.bounds.minY, geometry.bounds.minY),
            w:
              Math.max(acc.bounds.maxX, geometry.bounds.maxX) -
              Math.min(acc.bounds.minX, geometry.bounds.minX),
            x: Math.min(acc.bounds.minX, geometry.bounds.minX),
            y: Math.min(acc.bounds.minY, geometry.bounds.minY),
          };
        }

        return acc;
      },
      {
        bounds: {
          minX: Number.POSITIVE_INFINITY,
          minY: Number.POSITIVE_INFINITY,
          maxX: Number.NEGATIVE_INFINITY,
          maxY: Number.NEGATIVE_INFINITY,
        },
        h: 0,
        w: 0,
        x: 0,
        y: 0,
      },
    );

    const newAnnotation: Annotation = {
      ...annotations[0],
      id: annotations[0].id,
      order: Math.min(...annotations.map((annotation) => annotation.order)),
      target: {
        ...annotations[0].target,
        selector: {
          ...annotations[0].target.selector,
          geometry: mergedTarget,
        },
      },
    };

    //delete the old annotations and add the new one
    await db.transaction('rw', db.annotations, async () => {
      const idsToDelete = annotations.map((annotation) => annotation.id);
      await db.annotations.bulkDelete(idsToDelete);
      await db.annotations.add(newAnnotation);
    });
  }

  async deleteByIds(ids: string[]): Promise<string[]> {
    //1. get the annotations to delete and order them by scope
    const annotationsToDelete = await db.annotations.bulkGet(ids);
    const annotationsToDeleteByScopeAndType: { [key in string]?: Annotation[] } = {};
    for (const annotation of annotationsToDelete) {
      if (annotation === undefined) {
        continue;
      }
      const key = `${annotation?.canvasId}|${annotation?.collectionId}|${getAnnotationType(annotation)}`;
      if (!annotationsToDeleteByScopeAndType[key]) {
        annotationsToDeleteByScopeAndType[key] = [];
      }
      annotationsToDeleteByScopeAndType[key].push(annotation);
    }

    //2. for each scope, get the min order of the annotations to delete, and update the order of the annotations above
    const annotationsUpdated: Annotation[] = [];
    for (const key in annotationsToDeleteByScopeAndType) {
      const canvasId = key.split('|')[0];
      const collectionId = key.split('|')[1];
      const type = key.split('|')[2];
      //get the min order of the annotations to delete
      const minOrder = Math.min(...annotationsToDeleteByScopeAndType[key]!.map((a) => a.order));

      const annotationsToUpdate = await db.annotations
        .where('[canvasId+collectionId]')
        .equals([canvasId, collectionId])
        .filter(
          (a) =>
            a.order > minOrder &&
            !ids.includes(a.id) &&
            getAnnotationType(a) === (type as ElementType),
        )
        .sortBy('order');

      let newOrder = minOrder;
      for (let i = 0; i < annotationsToUpdate.length; i++) {
        const a = annotationsToUpdate[i];
        annotationsUpdated.push({ ...a, order: newOrder++ });
      }
    }

    //3. update the annotations and delete the annotations
    await db.transaction('rw', db.annotations, async () => {
      if (annotationsUpdated.length > 0) {
        await db.annotations.bulkPut(annotationsUpdated);
      }
      await db.annotations.bulkDelete(ids);
    });
    return ids;
  }

  async deleteById(id: string): Promise<void> {
    await this.deleteByIds([id]);
  }

  async deleteByScope(scope: Scope): Promise<string[]> {
    const annotations = await this.getByScope(scope);
    return this.deleteByIds(annotations.map((annotation) => annotation.id));
  }

  async deleteByScopeAndType(scope: Scope, types?: ElementType[]): Promise<string[]> {
    const annotations = await this.getByScopeAndTypes(scope, types);
    return this.deleteByIds(annotations.map((annotation) => annotation.id));
  }
}
