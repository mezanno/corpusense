import {
  Annotation,
  AnnotationDTO,
  createAnnotation,
  duplicateAnnotation,
  ElementType,
  getAnnotationType,
} from '@/data/models/Annotation';
import { CanvasScope, Scope } from '@/data/models/Scope';
import {
  getAnnotationRepository,
  getCollectionRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { contains } from '@/data/utils/annotations';
import i18n from '@/i18n';
import { getErrorMessage } from '@/utils/utils';
import { Canvas } from '@iiif/presentation-3';
import { PayloadAction } from '@reduxjs/toolkit';
import { t } from 'i18next';
import { isEqual, maxBy, minBy } from 'lodash';
import { call, Effect, put, select, takeEvery } from 'redux-saga/effects';
import {
  duplicateAnnotationsEach2PagesRequest,
  duplicateAnnotationsToAllPagesRequest,
  fetchAnnotationsRequest,
  fetchAnnotationsSuccess,
  recomputeRegionsRequest,
  removeAnnotationsByIdsRequest,
  removeAnnotationsByScopeRequest,
  removeAnnotationsInsideRequest,
  removeAnnotationsSuccess,
  saveAnnotationRequest,
  saveAnnotationsSuccess,
  updateAnnotationOrderRequest,
  updateAnnotationRequest,
} from '../reducers/annotations';
import { pushError, pushInfo } from '../reducers/events';
import { selectCurrentScope } from '../selectors/annotations';

/**
 * Saga to handle saving an annotation.
 *  creates a new annotation with the correct order value.
 * @param action
 */
function* handleSaveAnnotation(
  action: PayloadAction<AnnotationDTO>,
): Generator<Effect, void, Annotation | Annotation[]> {
  const annotationToSave = action.payload;
  console.log('handleSaveAnnotationRequest - ', annotationToSave);

  const annotationRepository = getAnnotationRepository();
  const annotationsForCanvas = (yield call(
    [annotationRepository, annotationRepository.getByScope],
    { canvasId: annotationToSave.canvasId, collectionId: annotationToSave.collectionId },
  )) as Annotation[];
  const regions = annotationsForCanvas
    .filter((a) => getAnnotationType(a) === getAnnotationType(annotationToSave))
    .map((a) => a.order ?? -1);
  const newOrder = regions.length > 0 ? Math.max(...regions) + 1 : 1;

  const newAnnotation = { ...annotationToSave, order: newOrder };
  const updatedAnnotations = (yield call(
    [annotationRepository, annotationRepository.update],
    newAnnotation,
  )) as Annotation[];
  yield put(saveAnnotationsSuccess(updatedAnnotations));
}

/**
 * Saga to handle saving an annotation.
 * It checks if the annotation already exists in the database.
 * If it does, it updates the annotation if it's different from the existing one.
 * @param action
 */
function* handleUpdateAnnotation(
  action: PayloadAction<Annotation>,
): Generator<Effect, void, Annotation | Annotation[]> {
  const annotationToSave = action.payload;
  console.log('handleSaveAnnotationRequest - ', annotationToSave);
  try {
    const annotationRepository = getAnnotationRepository();
    const existingAnnotation = yield call(
      [annotationRepository, annotationRepository.getById],
      annotationToSave.id,
    );
    //save only if annotations are different to avoid unnecessary writes and call to saveAnnotationSuccess
    if (!isEqual(existingAnnotation, annotationToSave)) {
      const updatedAnnotations = (yield call(
        [annotationRepository, annotationRepository.update],
        annotationToSave,
      )) as Annotation[];
      yield put(saveAnnotationsSuccess(updatedAnnotations));
      yield put(pushInfo(i18n.t('toast_annotation_saved')));
    }
  } catch (e) {
    console.warn(e);
  }
}

function* handleRemoveAnnotationsByIds(
  action: PayloadAction<string[]>,
): Generator<Effect, void, CanvasScope | undefined | Annotation[]> {
  const annotationRepository = getAnnotationRepository();

  const scope = (yield select(selectCurrentScope)) as CanvasScope | undefined;
  try {
    yield call([annotationRepository, annotationRepository.deleteByIds], action.payload);
    if (scope !== undefined) {
      const annotations = (yield call(
        [annotationRepository, annotationRepository.getByScope],
        scope,
      )) as Annotation[];
      yield put(fetchAnnotationsSuccess({ scope, annotations }));
    }
    yield put(pushInfo(i18n.t('toast_annotation_deleted', { count: action.payload.length })));
  } catch (e) {
    console.warn(e);
  }
}

function* handleRemoveAnnotationsByScope(
  action: PayloadAction<{ scope: Scope; types?: ElementType[] }>,
): Generator<Effect, void, string[]> {
  const { scope, types } = action.payload;
  const annotationRepository = getAnnotationRepository();
  const annotationsDeleted: string[] = yield call(
    [annotationRepository, annotationRepository.deleteByScopeAndType],
    scope,
    types,
  );

  yield put(removeAnnotationsSuccess(annotationsDeleted));
  yield put(pushInfo(i18n.t('toast_annotation_deleted', { count: annotationsDeleted.length })));
}

function* handleRemoveAnnotationsInside(
  action: PayloadAction<Annotation>,
): Generator<Effect, void, Annotation[]> {
  const annotation = action.payload;
  if (getAnnotationType(annotation) !== ElementType.REGION) {
    yield put(pushError(t('error_annotation_is_not_region')));
    return;
  }
  try {
    const annotationRepository = getAnnotationRepository();
    const { canvasId, collectionId } = annotation;
    const annotationsInSameCanvas = yield call(
      [annotationRepository, annotationRepository.getByScope],
      { canvasId, collectionId },
    );
    const annotationsIdsToRemove = annotationsInSameCanvas
      .filter((a) => contains(annotation, a))
      .map((a) => a.id);

    yield call([annotationRepository, annotationRepository.deleteByIds], annotationsIdsToRemove);
    yield put(removeAnnotationsSuccess(annotationsIdsToRemove));
    yield put(
      pushInfo(i18n.t('toast_annotation_deleted', { count: annotationsIdsToRemove.length })),
    );
  } catch (e) {
    console.warn(e);
    yield put(pushError(getErrorMessage(e)));
  }
}

function* handleUpdateAnnotationOrder(
  action: PayloadAction<{ annotationId: string; value: number }>,
): Generator<Effect, void, Annotation[]> {
  try {
    const annotationRepository = getAnnotationRepository();
    const updatedAnnotations = yield call(
      [annotationRepository, annotationRepository.updateOrder],
      action.payload.annotationId,
      action.payload.value,
    );
    yield put(saveAnnotationsSuccess(updatedAnnotations));
  } catch (error) {
    console.warn(error);
  }
}

function* handleDuplicateAnnotationsToAllPages(
  action: PayloadAction<{ canvasId: string; collectionId: string }>,
): Generator<Effect, void, Canvas[]> {
  const { canvasId, collectionId } = action.payload;
  try {
    const collectionRepository = getCollectionRepository();
    const canvasOfCollection = yield call(
      [collectionRepository, collectionRepository.getCanvasesByCollectionId],
      collectionId,
    );
    const canvasIds = canvasOfCollection.map((c) => c.id);
    yield call(duplicateAnnotationsToPages, {
      canvasId,
      collectionId,
      canvasIds,
    });
  } catch (e) {
    console.warn(e);
  }
}

function* handleDuplicateAnnotationsEach2Pages(
  action: PayloadAction<{ canvasId: string; collectionId: string }>,
): Generator<Effect, void, Canvas[]> {
  const { canvasId, collectionId } = action.payload;
  try {
    const collectionRepository = getCollectionRepository();
    const canvasOfCollection = yield call(
      [collectionRepository, collectionRepository.getCanvasesByCollectionId],
      collectionId,
    );
    const canvasIds = canvasOfCollection.map((c) => c.id);
    const positionOfCanvas = canvasIds.findIndex((id) => id === canvasId);
    const canvasesIdsToDuplicateTo =
      positionOfCanvas % 2 === 0
        ? canvasIds.filter((_, index) => index % 2 === 0)
        : canvasIds.filter((_, index) => index % 2 !== 0);

    yield call(duplicateAnnotationsToPages, {
      canvasId,
      collectionId,
      canvasIds: canvasesIdsToDuplicateTo,
    });

    yield put(pushInfo(i18n.t('toast_duplicate_success')));
  } catch (e) {
    console.warn(e);
  }
}

function* duplicateAnnotationsToPages({
  canvasId,
  collectionId,
  canvasIds,
}: {
  canvasId: string;
  collectionId: string;
  canvasIds: string[];
}): Generator<Effect, void, Annotation[]> {
  try {
    //1st step: get all (region) annotations of the canvas
    const annotationRepository = getAnnotationRepository();
    const annotations = yield call(
      [annotationRepository, annotationRepository.getByScopeAndTypes],
      { canvasId, collectionId },
      [ElementType.REGION],
    );

    if (annotations.length > 0) {
      let duplicatedAnnotations: Annotation[] = [];
      let removedAnnotations: string[] = [];
      for (const id of canvasIds) {
        if (id !== canvasId) {
          //3rd step: remove the region annotations that are already on the canvases
          const regions = yield call(
            [annotationRepository, annotationRepository.getByScopeAndTypes],
            { canvasId: id, collectionId },
            [ElementType.REGION],
          );
          const annotationIds = regions.map((r) => r.id);
          removedAnnotations = [...removedAnnotations, ...annotationIds];
          yield call([annotationRepository, annotationRepository.deleteByIds], annotationIds);

          //4th step: duplicate the annotations to the other canvases
          duplicatedAnnotations = [
            ...duplicatedAnnotations,
            ...annotations.map((a) => duplicateAnnotation(a, id)),
          ];
        }
      }
      if (duplicatedAnnotations.length > 0) {
        yield call([annotationRepository, annotationRepository.addAll], duplicatedAnnotations);
      }
    }
  } catch (e) {
    console.warn(e);
  }
}

function* handleRecomputeRegions(
  action: PayloadAction<string>,
): Generator<Effect, void, Canvas[] | Annotation[]> {
  const collectionId = action.payload;
  /*
    for each canvas, compute the new region annotation
    first, remove the existing region annotation
    then compute the new region annotation that contains all the lines
    if there is no line on the canvas, create a region annotation that covers the whole canvas
  */
  const collectionRepository = getCollectionRepository();
  const canvases = (yield call(
    [collectionRepository, collectionRepository.getCanvasesByCollectionId],
    collectionId,
  )) as Canvas[];
  const annotationRepository = getAnnotationRepository();
  let removedAnnotations: string[] = [];
  const newRegionsAnnotations: AnnotationDTO[] = [];
  for (const canvas of canvases) {
    //remove the region annotations that are already on the canvases
    const regions = yield call(
      [annotationRepository, annotationRepository.getByScopeAndTypes],
      { canvasId: canvas.id, collectionId },
      [ElementType.REGION],
    );
    const annotationIds = regions.map((r) => r.id);
    removedAnnotations = [...removedAnnotations, ...annotationIds];
    yield call([annotationRepository, annotationRepository.deleteByIds], annotationIds);

    const lines = (yield call(
      [annotationRepository, annotationRepository.getByScopeAndTypes],
      { canvasId: canvas.id, collectionId },
      [ElementType.LINE],
    )) as Annotation[];
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
          type: ElementType.REGION,
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
        type: ElementType.REGION,
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
    yield call([annotationRepository, annotationRepository.addAll], newRegionsAnnotations);
    //TODO : update store yield put(update...)
  }
}

function* handleFetchAnnotations(
  action: PayloadAction<CanvasScope>,
): Generator<Effect, void, Annotation[]> {
  const { collectionId, canvasId } = action.payload;
  const annotationRepository = getAnnotationRepository();
  const annotations = yield call([annotationRepository, annotationRepository.getByScope], {
    canvasId,
    collectionId,
  });
  yield put(fetchAnnotationsSuccess({ scope: action.payload, annotations }));
}

export default function* annotationsSaga() {
  yield takeEvery(fetchAnnotationsRequest, handleFetchAnnotations);
  yield takeEvery(saveAnnotationRequest, handleSaveAnnotation);
  yield takeEvery(updateAnnotationRequest, handleUpdateAnnotation);
  yield takeEvery(removeAnnotationsByScopeRequest, handleRemoveAnnotationsByScope);
  yield takeEvery(removeAnnotationsByIdsRequest, handleRemoveAnnotationsByIds);
  yield takeEvery(removeAnnotationsInsideRequest, handleRemoveAnnotationsInside);
  yield takeEvery(updateAnnotationOrderRequest, handleUpdateAnnotationOrder);
  yield takeEvery(duplicateAnnotationsToAllPagesRequest, handleDuplicateAnnotationsToAllPages);
  yield takeEvery(duplicateAnnotationsEach2PagesRequest, handleDuplicateAnnotationsEach2Pages);
  yield takeEvery(recomputeRegionsRequest, handleRecomputeRegions);
}

export { handleRemoveAnnotationsByIds, handleSaveAnnotation, handleUpdateAnnotationOrder };
