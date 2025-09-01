import {
  Annotation,
  AnnotationDTO,
  createAnnotation,
  duplicateAnnotation,
  ElementType,
  getAnnotationType,
} from '@/data/models/Annotation';
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
import { call, Effect, put, takeEvery } from 'redux-saga/effects';
import {
  duplicateAnnotationsEach2PagesRequest,
  duplicateAnnotationsToAllPagesRequest,
  fetchAnnotationsRequest,
  fetchAnnotationsSuccess,
  recomputeRegionsRequest,
  removeAllRegionAnnotationsRequest,
  removeAnnotationsByScopeRequest,
  removeAnnotationsRequest,
  removeAnnotationsSuccess,
  saveAnnotationRequest,
  saveAnnotationSuccess,
  updateAnnotationOrderValueRequest,
  updateAnnotationOrderValueSuccess,
  updateAnnotationRequest,
} from '../reducers/annotations';
// import { setCanvasFromComponent, SetCanvasFromComponentPayload } from '../reducers/canvas';
import { CanvasScope, Scope } from '@/data/models/Scope';
import { pushError, pushInfo } from '../reducers/events';

/**
 * Saga to handle saving an annotation.
 * It checks if the annotation already exists in the database.
 * If it does, it updates the annotation if it's different from the existing one.
 * If it doesn't, it creates a new annotation with the correct order value.
 * @param action
 */
function* handleSaveAnnotation(
  action: PayloadAction<AnnotationDTO>,
): Generator<Effect, void, Annotation | Annotation[]> {
  const annotationToSave = action.payload;
  console.log('handleSaveAnnotationRequest - ', annotationToSave);

  //TODO : this should be done in the repository
  const annotationRepository = getAnnotationRepository();
  const annotationsForCanvas = (yield call(
    [annotationRepository, annotationRepository.getAnnotationsByScope],
    { canvasId: annotationToSave.canvasId, collectionId: annotationToSave.collectionId },
  )) as Annotation[];
  const regions = annotationsForCanvas
    .filter((a) => getAnnotationType(a) === getAnnotationType(annotationToSave))
    .map((a) => a.order ?? -1);
  const newOrder = regions.length > 0 ? Math.max(...regions) + 1 : 1;

  const newAnnotation = { ...annotationToSave, order: newOrder };
  yield call([annotationRepository, annotationRepository.updateAnnotation], newAnnotation);
  yield put(saveAnnotationSuccess(newAnnotation));
}

/**
 * Saga to handle saving an annotation.
 * It checks if the annotation already exists in the database.
 * If it does, it updates the annotation if it's different from the existing one.
 * If it doesn't, it creates a new annotation with the correct order value.
 * @param action
 */
function* handleUpdateAnnotation(
  action: PayloadAction<Annotation>,
): Generator<Effect, void, Annotation | Annotation[]> {
  const annotationToSave = action.payload;
  console.log('handleSaveAnnotationRequest - ', annotationToSave);
  try {
    const annotationRepository = getAnnotationRepository();
    let existingAnnotation = undefined;
    try {
      existingAnnotation = yield call(
        [annotationRepository, annotationRepository.getById],
        annotationToSave.id,
      );
      //save only if annotations are different to avoid unnecessary writes and call to saveAnnotationSuccess
      if (!isEqual(existingAnnotation, annotationToSave)) {
        yield call([annotationRepository, annotationRepository.updateAnnotation], annotationToSave);
        yield put(saveAnnotationSuccess(annotationToSave));
      }
    } catch (error) {
      // If the annotation does not exist, create it
      //compute the order value if not set or if set to 1
      //TODO : this should be done in the repository
      let newOrder = annotationToSave.order;
      if (
        (annotationToSave.order === undefined || annotationToSave.order === 0) &&
        annotationToSave.canvasId !== undefined &&
        annotationToSave.collectionId !== undefined
      ) {
        const annotationsForCanvas = (yield call(
          [annotationRepository, annotationRepository.getAnnotationsByScope],
          { canvasId: annotationToSave.canvasId, collectionId: annotationToSave.collectionId },
        )) as Annotation[];
        const regions = annotationsForCanvas
          .filter((a) => getAnnotationType(a) === getAnnotationType(annotationToSave))
          .map((a) => a.order ?? -1);
        newOrder = regions.length > 0 ? Math.max(...regions) + 1 : 1;
      }
      const newAnnotation = { ...annotationToSave, order: newOrder };
      yield call([annotationRepository, annotationRepository.updateAnnotation], newAnnotation);
      yield put(saveAnnotationSuccess(newAnnotation));
    }
  } catch (e) {
    console.warn(e);
  }
}

function* handleRemoveAnnotation(action: PayloadAction<string[]>) {
  const annotationRepository = getAnnotationRepository();
  const annotationsDeleted: string[] = [];
  for (let i = 0; i < action.payload.length; i++) {
    const annotationId = action.payload[i];
    try {
      yield call([annotationRepository, annotationRepository.removeById], annotationId);
      annotationsDeleted.push(annotationId);
    } catch (e) {
      console.warn(e);
    }
  }
  yield put(removeAnnotationsSuccess(annotationsDeleted));
}

function* handleRemoveAnnotationsByScope(
  action: PayloadAction<{ scope: Scope; types?: ElementType[] }>,
): Generator<Effect, void, string[]> {
  const { scope, types } = action.payload;
  const annotationRepository = getAnnotationRepository();
  const annotationsDeleted: string[] = yield call(
    [annotationRepository, annotationRepository.removeByScopeAndType],
    scope,
    types,
  );

  yield put(removeAnnotationsSuccess(annotationsDeleted));
}

function* handleRemoveAllRegionAnnotations(
  action: PayloadAction<Annotation>,
): Generator<Effect, void, Annotation[]> {
  const annotation = action.payload;
  if (getAnnotationType(annotation) !== ElementType.REGION) {
    yield put(pushError(t('error_annotation_is_not_region')));
    return;
  }
  try {
    const annotationRepository = getAnnotationRepository();
    const canvasId = annotation.canvasId;
    const collectionId = annotation.collectionId;
    if (canvasId !== undefined && collectionId !== undefined) {
      const annotationsInSameCanvas = yield call(
        [annotationRepository, annotationRepository.getAnnotationsByScope],
        { canvasId, collectionId },
      );
      const annotationsIdsToRemove = annotationsInSameCanvas
        .filter((a) => contains(annotation, a))
        .map((a) => a.id);

      yield call(
        [annotationRepository, annotationRepository.removeAllById],
        annotationsIdsToRemove,
      );
      yield put(removeAnnotationsSuccess(annotationsIdsToRemove));
    }
  } catch (e) {
    console.warn(e);
    yield put(pushError(getErrorMessage(e)));
  }
}

function* handleUpdateAnnotationOrderValue(
  action: PayloadAction<{ annotationId: string; value: number }>,
) {
  try {
    const annotationRepository = getAnnotationRepository();
    yield call(
      [annotationRepository, annotationRepository.updateOrder],
      action.payload.annotationId,
      action.payload.value,
    );
    yield put(updateAnnotationOrderValueSuccess(action.payload));
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
    yield call(handleDuplicateAnnotationsToPages, {
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

    yield call(handleDuplicateAnnotationsToPages, {
      canvasId,
      collectionId,
      canvasIds: canvasesIdsToDuplicateTo,
    });

    yield put(pushInfo(i18n.t('toast_duplicate_success')));
  } catch (e) {
    console.warn(e);
  }
}

function* handleDuplicateAnnotationsToPages({
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
      [annotationRepository, annotationRepository.getAnnotationsByScopeAndType],
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
            [annotationRepository, annotationRepository.getAnnotationsByScopeAndType],
            { canvasId: id, collectionId },
            [ElementType.REGION],
          );
          const annotationIds = regions.map((r) => r.id);
          removedAnnotations = [...removedAnnotations, ...annotationIds];
          yield call([annotationRepository, annotationRepository.removeAllById], annotationIds);

          //4th step: duplicate the annotations to the other canvases
          duplicatedAnnotations = [
            ...duplicatedAnnotations,
            ...annotations.map((a) => duplicateAnnotation(a, id)),
          ];
        }
      }
      if (duplicatedAnnotations.length > 0) {
        yield call(
          [annotationRepository, annotationRepository.saveAllAnnotations],
          duplicatedAnnotations,
        );
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

  const annotationRepository = getAnnotationRepository();
  let removedAnnotations: string[] = [];
  const newRegionsAnnotations: AnnotationDTO[] = [];
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
  for (const canvas of canvases) {
    //remove the region annotations that are already on the canvases
    const regions = yield call(
      [annotationRepository, annotationRepository.getAnnotationsByScopeAndType],
      { canvasId: canvas.id, collectionId },
      [ElementType.REGION],
    );
    const annotationIds = regions.map((r) => r.id);
    removedAnnotations = [...removedAnnotations, ...annotationIds];
    yield call([annotationRepository, annotationRepository.removeAllById], annotationIds);

    const lines = (yield call(
      [annotationRepository, annotationRepository.getAnnotationsByScopeAndType],
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
    yield call(
      [annotationRepository, annotationRepository.saveAllAnnotations],
      newRegionsAnnotations,
    );
    //TODO : update store yield put(update...)
  }
}

function* handleLoadAnnotationsForCanvas(
  action: PayloadAction<CanvasScope>,
): Generator<Effect, void, Annotation[]> {
  const { collectionId, canvasId } = action.payload;
  // load all the annotations of the collection
  const annotationRepository = getAnnotationRepository();
  const annotations = yield call(
    [annotationRepository, annotationRepository.getAnnotationsByScope],
    { canvasId, collectionId },
  );
  yield put(fetchAnnotationsSuccess({ scope: action.payload, annotations }));
}

export default function* annotationsSaga() {
  yield takeEvery(fetchAnnotationsRequest, handleLoadAnnotationsForCanvas);
  yield takeEvery(saveAnnotationRequest, handleSaveAnnotation);
  yield takeEvery(updateAnnotationRequest, handleUpdateAnnotation);
  yield takeEvery(removeAnnotationsByScopeRequest, handleRemoveAnnotationsByScope);
  yield takeEvery(removeAnnotationsRequest, handleRemoveAnnotation);
  yield takeEvery(removeAllRegionAnnotationsRequest, handleRemoveAllRegionAnnotations);
  yield takeEvery(updateAnnotationOrderValueRequest, handleUpdateAnnotationOrderValue);
  yield takeEvery(duplicateAnnotationsToAllPagesRequest, handleDuplicateAnnotationsToAllPages);
  yield takeEvery(duplicateAnnotationsEach2PagesRequest, handleDuplicateAnnotationsEach2Pages);
  yield takeEvery(recomputeRegionsRequest, handleRecomputeRegions);
}

export { handleRemoveAnnotation, handleSaveAnnotation, handleUpdateAnnotationOrderValue };
