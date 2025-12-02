import {
  Annotation,
  AnnotationDTO,
  createAnnotation,
  createAnnotationFromAnnotorious,
  createBodies,
  duplicateAnnotation,
  ElementType,
  getAnnotationType,
} from '@/data/models/Annotation';
import { CollectionElement } from '@/data/models/CollectionElement';
import { CanvasScope, Scope } from '@/data/models/Scope';
import {
  getAnnotationRepository,
  getCollectionRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { contains } from '@/data/utils/annotations';
import { useAppDispatch } from '@/hooks/hooks';
import i18n from '@/i18n';
import { pushError, pushInfo } from '@/state/reducers/events';
import { getErrorMessage } from '@/utils/utils';
import { ImageAnnotation } from '@annotorious/annotorious';
import { isEqual, maxBy, minBy } from 'lodash';
import { useMemo } from 'react';

export enum DuplicateDistribution {
  ALL_PAGES = 'all_pages',
  EACH2_PAGES = 'each2_pages',
}

export enum DuplicateLimit {
  ALL = 'all',
  BEFORE = 'before',
  AFTER = 'after',
}

export interface DuplicateRegionsPayload {
  distribution: DuplicateDistribution;
  limit: DuplicateLimit;
  scope: CanvasScope;
}

export const useAnnotationActions = () => {
  const appDispatch = useAppDispatch();
  const annotationRepository = useMemo(() => getAnnotationRepository(), []);

  /**
   *  creates a new annotation with the correct order value.
   * @param action
   */
  const saveAnnotation = async (
    annotation: ImageAnnotation,
    canvasId: string,
    collectionId: string,
  ) => {
    const newAnnotation = createAnnotationFromAnnotorious({
      annotation,
      canvasId,
      collectionId,
      type: ElementType.TEXT_REGION,
      value: '',
    });
    const annotationsForCanvas = await annotationRepository.getByScope({
      canvasId,
      collectionId,
    });
    const regions = annotationsForCanvas
      .filter((a) => getAnnotationType(a) === getAnnotationType(newAnnotation))
      .map((a) => a.order ?? -1);

    const newOrder = regions.length > 0 ? Math.max(...regions) + 1 : 1;

    await annotationRepository.update({ ...newAnnotation, order: newOrder });
  };

  /**
   * save an annotation.
   * It checks if the annotation already exists in the database.
   * If it does, it updates the annotation if it's different from the existing one.
   * @param action
   */
  const updateAnnotation = async (
    annotationToSave: Annotation,
    type?: ElementType,
    value?: string,
  ) => {
    console.log('updateAnnotation - ', annotationToSave);

    if (type !== undefined && value !== undefined) {
      annotationToSave = {
        ...annotationToSave,
        type: type ?? annotationToSave.type,
        bodies: createBodies(type, value, annotationToSave.id),
      };
    }

    try {
      const existingAnnotation = await annotationRepository.getById(annotationToSave.id);
      //save only if annotations are different to avoid unnecessary writes and call to saveAnnotationSuccess
      if (!isEqual(existingAnnotation, annotationToSave)) {
        await annotationRepository.update(annotationToSave);
        appDispatch(pushInfo(i18n.t('toast_annotation_saved')));
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const updateAnnotationOrder = async (annotationId: string, value: number) => {
    try {
      await annotationRepository.updateOrder(annotationId, value);
    } catch (error) {
      console.warn(error);
    }
  };

  const duplicateRegions = async (payload: DuplicateRegionsPayload) => {
    const { scope, distribution, limit } = payload;
    try {
      const collectionRepository = getCollectionRepository();
      const collection = await collectionRepository.getById(scope.collectionId);
      //Element dans la collection qui sert de référence pour la duplication
      const baseElement = collection.content.find(
        (el: CollectionElement) => el.canvasId === scope.canvasId,
      );
      if (!baseElement) {
        appDispatch(pushError(i18n.t('error_collection_no_canvas')));
        return;
      }

      //filtrer by distribution
      let filteredContent: CollectionElement[] = [];
      if (distribution === DuplicateDistribution.ALL_PAGES) {
        filteredContent = collection.content;
      } else {
        if (baseElement.position % 2 === 0) {
          filteredContent = collection.content.filter((el) => el.position % 2 === 0);
        } else {
          filteredContent = collection.content.filter((el) => el.position % 2 !== 0);
        }
      }
      //filtrer by limit
      if (limit === DuplicateLimit.BEFORE) {
        filteredContent = filteredContent.filter((el) => el.position <= baseElement.position);
      } else if (limit === DuplicateLimit.AFTER) {
        filteredContent = filteredContent.filter((el) => el.position >= baseElement.position);
      }

      await duplicateAnnotationsToPages(
        scope,
        filteredContent.map((el) => el.canvasId).filter((id) => id !== scope.canvasId),
      );

      appDispatch(pushInfo(i18n.t('toast_duplicate_success')));
    } catch (e) {
      console.warn(e);
    }
  };

  const duplicateAnnotationsToPages = async (scope: CanvasScope, canvasIds: string[]) => {
    try {
      //1st step: get all (region) annotations of the canvas to duplicate
      const annotations = await annotationRepository.getByScopeAndTypes(scope, [
        ElementType.TEXT_REGION,
      ]);

      if (annotations.length > 0) {
        let duplicatedAnnotations: Annotation[] = [];
        let removedAnnotations: string[] = [];
        for (const id of canvasIds) {
          if (id !== scope.canvasId) {
            //2nd step: remove the region annotations that are already on the canvases
            const regions = await annotationRepository.getByScopeAndTypes(
              { canvasId: id, collectionId: scope.collectionId },
              [ElementType.TEXT_REGION],
            );
            const annotationIds = regions.map((r) => r.id);
            removedAnnotations = [...removedAnnotations, ...annotationIds];
            await annotationRepository.deleteByIds(annotationIds);

            //3rd step: duplicate the annotations to the other canvases
            duplicatedAnnotations = [
              ...duplicatedAnnotations,
              ...annotations.map((a) => duplicateAnnotation(a, id)),
            ];
          }
        }
        if (duplicatedAnnotations.length > 0) {
          await annotationRepository.addAll(duplicatedAnnotations);
        }
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const recomputeRegions = async (collectionId: string) => {
    /*
    for each canvas, compute the new region annotation
    first, remove the existing region annotation
    then compute the new region annotation that contains all the lines
    if there is no line on the canvas, create a region annotation that covers the whole canvas
  */
    const collectionRepository = getCollectionRepository();
    const canvases = await collectionRepository.getCanvasesByCollectionId(collectionId);

    let removedAnnotations: string[] = [];
    const newRegionsAnnotations: AnnotationDTO[] = [];
    for (const canvas of canvases) {
      //remove the region annotations that are already on the canvases
      const regions = await annotationRepository.getByScopeAndTypes(
        { canvasId: canvas.id, collectionId },
        [ElementType.TEXT_REGION],
      );
      const annotationIds = regions.map((r) => r.id);
      removedAnnotations = [...removedAnnotations, ...annotationIds];
      await annotationRepository.deleteByIds(annotationIds);

      const lines = await annotationRepository.getByScopeAndTypes(
        { canvasId: canvas.id, collectionId },
        [ElementType.TEXT_LINE],
      );
      if (lines.length > 0) {
        //compute the coordinates of the new region annotation
        const minX = minBy(lines, (l) => l.target.selector.geometry.bounds.minX)?.target.selector
          .geometry.bounds.minX;
        const minY = minBy(lines, (l) => l.target.selector.geometry.bounds.minY)?.target.selector
          .geometry.bounds.minY;
        const maxX = maxBy(lines, (l) => l.target.selector.geometry.bounds.maxX)?.target.selector
          .geometry.bounds.maxX;
        const maxY = maxBy(lines, (l) => l.target.selector.geometry.bounds.maxY)?.target.selector
          .geometry.bounds.maxY;
        if (minX !== undefined && minY !== undefined && maxX !== undefined && maxY !== undefined) {
          const region = createAnnotation({
            canvasId: canvas.id,
            collectionId,
            // order: 1,
            type: ElementType.TEXT_REGION,
            value: '',
            minX,
            minY,
            maxX,
            maxY,
          });
          newRegionsAnnotations.push(region);
        }
      } else {
        //if there is no line, create a region annotation that covers the whole canvas
        const region = createAnnotation({
          canvasId: canvas.id,
          collectionId,
          order: 1,
          type: ElementType.TEXT_REGION,
          value: '',
          minX: 0,
          minY: 0,
          maxX: canvas.width ?? 1000,
          maxY: canvas.height ?? 1000,
        });
        newRegionsAnnotations.push(region);
      }
    }
    if (newRegionsAnnotations.length > 0) {
      await annotationRepository.addAll(newRegionsAnnotations);
    }
  };

  const removeAnnotationsByIds = async (ids: string[]) => {
    try {
      await annotationRepository.deleteByIds(ids);
      appDispatch(pushInfo(i18n.t('toast_annotation_deleted', { count: ids.length })));
    } catch (e) {
      console.warn(e);
    }
  };

  // used to remove all annotations of a given scope (canvas, collection or 1 specific annotation)
  const removeAnnotationsByScope = async (scope: Scope, types?: ElementType[]) => {
    const idsDeleted = await annotationRepository.deleteByScopeAndType(scope, types);
    appDispatch(pushInfo(i18n.t('toast_annotation_deleted', { count: idsDeleted.length })));
  };

  //remove all annotations inside a specific annotation
  const removeAnnotationsInside = async (annotation: Annotation) => {
    if (getAnnotationType(annotation) !== ElementType.TEXT_REGION) {
      appDispatch(pushError(i18n.t('error_annotation_is_not_region')));
      return;
    }
    try {
      const { canvasId, collectionId } = annotation;
      const annotationsInSameCanvas = await annotationRepository.getByScope({
        canvasId,
        collectionId,
      });
      const annotationsIdsToRemove = annotationsInSameCanvas
        .filter((a) => contains(annotation, a))
        .map((a) => a.id);

      await annotationRepository.deleteByIds(annotationsIdsToRemove);
      appDispatch(
        pushInfo(i18n.t('toast_annotation_deleted', { count: annotationsIdsToRemove.length })),
      );
    } catch (e) {
      console.warn(e);
      appDispatch(pushError(getErrorMessage(e)));
    }
  };

  return {
    saveAnnotation,
    updateAnnotation,
    updateAnnotationOrder,
    duplicateRegions,
    recomputeRegions,
    removeAnnotationsByIds,
    removeAnnotationsByScope,
    removeAnnotationsInside,
  };
};
