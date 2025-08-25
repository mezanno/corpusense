import {
  Annotation,
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
import { groupBy, isEqual, maxBy, minBy } from 'lodash';
import { call, Effect, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import {
  duplicateAnnotationsEach2PagesRequest,
  duplicateAnnotationsToAllPagesRequest,
  fetchAnnotationsSuccess,
  recomputeRegionsRequest,
  removeAllAnnotationsSuccess,
  removeAllCanvasAnnotationsRequest,
  removeAllCollectionAnnotationsRequest,
  removeAllRegionAnnotationsRequest,
  removeAnnotationRequest,
  removeAnnotationSuccess,
  saveAnnotationRequest,
  saveAnnotationSuccess,
  syncWithDB,
  updateAnnotationOrderValueRequest,
  updateAnnotationOrderValueSuccess,
} from '../reducers/annotations';
import { setCanvasFromComponent, SetCanvasFromComponentPayload } from '../reducers/canvas';
import { pushError, pushInfo } from '../reducers/events';
import { getAnnotations } from '../selectors/annotations';

/**
 * Saga to handle saving an annotation.
 * It checks if the annotation already exists in the database.
 * If it does, it updates the annotation if it's different from the existing one.
 * If it doesn't, it creates a new annotation with the correct order value.
 * @param action
 */
function* handleSaveAnnotation(
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
      //compute the order value if not set or if set to 0
      //TODO : this should be done in the repository
      let newOrder = annotationToSave.order;
      if (
        (annotationToSave.order === undefined || annotationToSave.order === 0) &&
        annotationToSave.canvasId !== undefined &&
        annotationToSave.collectionId !== undefined
      ) {
        const annotationsForCanvas = (yield call(
          [annotationRepository, annotationRepository.getAnnotationsForCanvas],
          annotationToSave.canvasId,
          annotationToSave.collectionId,
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
  yield put(removeAnnotationSuccess(annotationsDeleted));
}

function* handleRemoveAllCollectionAnnotations(
  action: PayloadAction<string>,
): Generator<Effect, void, string[]> {
  const collectionId = action.payload;
  try {
    const annotationRepository = getAnnotationRepository();
    const annotationIds = yield call([annotationRepository, annotationRepository.removeByScope], {
      collectionId,
    });
    yield put(removeAllAnnotationsSuccess(annotationIds));
  } catch (e) {
    console.warn(e);
    yield put(pushError(getErrorMessage(e)));
  }
}

function* handleRemoveAllCanvasAnnotations(
  action: PayloadAction<{ canvasId: string; collectionId: string }>,
): Generator<Effect, void, string[]> {
  try {
    const { canvasId, collectionId } = action.payload;
    const annotationRepository = getAnnotationRepository();
    const annotationIds = yield call([annotationRepository, annotationRepository.removeByScope], {
      canvasId,
      collectionId,
    });
    yield put(removeAllAnnotationsSuccess(annotationIds));
  } catch (e) {
    console.warn(e);
    yield put(pushError(getErrorMessage(e)));
  }
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
        [annotationRepository, annotationRepository.getAnnotationsForCanvas],
        canvasId,
        collectionId,
      );
      const annotationsIdsToRemove = annotationsInSameCanvas
        .filter((a) => contains(annotation, a))
        .map((a) => a.id);

      yield call(
        [annotationRepository, annotationRepository.removeAllById],
        annotationsIdsToRemove,
      );
      yield put(removeAllAnnotationsSuccess(annotationsIdsToRemove));
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
      [annotationRepository, annotationRepository.getAnnotationsForCanvasByType],
      canvasId,
      collectionId,
      ElementType.REGION,
    );

    if (annotations.length > 0) {
      let duplicatedAnnotations: Annotation[] = [];
      let removedAnnotations: string[] = [];
      for (const id of canvasIds) {
        if (id !== canvasId) {
          //3rd step: remove the region annotations that are already on the canvases
          const regions = yield call(
            [annotationRepository, annotationRepository.getAnnotationsForCanvasByType],
            id,
            collectionId,
            ElementType.REGION,
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
      yield put(removeAllAnnotationsSuccess(removedAnnotations));
      yield put(fetchAnnotationsSuccess(duplicatedAnnotations));
    }
  } catch (e) {
    console.warn(e);
  }
}

function* handleRecomputeRegions(
  action: PayloadAction<string>,
): Generator<Effect, void, Annotation[]> {
  const collectionId = action.payload;

  const annotationRepository = getAnnotationRepository();
  const annotations = yield call(
    [annotationRepository, annotationRepository.getAnnotationsForCollection],
    collectionId,
  );
  const lines = groupBy(
    annotations.filter((a) => getAnnotationType(a) === ElementType.LINE),
    'canvasId',
  );
  let removedAnnotations: string[] = [];
  const newRegionsAnnotations: Annotation[] = [];
  for (const [canvasId, canvasLines] of Object.entries(lines)) {
    if (canvasLines.length > 0) {
      //remove the region annotations that are already on the canvases
      const regions = yield call(
        [annotationRepository, annotationRepository.getAnnotationsForCanvasByType],
        canvasId,
        collectionId,
        ElementType.REGION,
      );
      const annotationIds = regions.map((r) => r.id);
      removedAnnotations = [...removedAnnotations, ...annotationIds];
      yield call([annotationRepository, annotationRepository.removeAllById], annotationIds);

      //compute the coordinates of the new region annotation
      const minX = minBy(canvasLines, (l) => l.target.selector.geometry.bounds.minX)?.target
        .selector.geometry.bounds.minX;
      const minY = minBy(canvasLines, (l) => l.target.selector.geometry.bounds.minY)?.target
        .selector.geometry.bounds.minY;
      const maxX = maxBy(canvasLines, (l) => l.target.selector.geometry.bounds.maxX)?.target
        .selector.geometry.bounds.maxX;
      const maxY = maxBy(canvasLines, (l) => l.target.selector.geometry.bounds.maxY)?.target
        .selector.geometry.bounds.maxY;
      if (minX !== undefined && minY !== undefined && maxX !== undefined && maxY !== undefined) {
        const region = createAnnotation({
          canvasId,
          collectionId,
          type: ElementType.REGION,
          value: '',
          minX,
          minY,
          maxX,
          maxY,
        });
        newRegionsAnnotations.push(region);
      }
    }
  }
  if (newRegionsAnnotations.length > 0) {
    yield call(
      [annotationRepository, annotationRepository.saveAllAnnotations],
      newRegionsAnnotations,
    );
  }
  yield put(removeAllAnnotationsSuccess(removedAnnotations));
  yield put(fetchAnnotationsSuccess(newRegionsAnnotations));
}

function* handleSyncWithDB(
  action: PayloadAction<{ canvasId: string; collectionId: string }>,
): Generator<Effect, void, Annotation[]> {
  const { canvasId, collectionId } = action.payload;
  try {
    const annotations = yield select(getAnnotations, canvasId, collectionId);
    const annotationRepository = getAnnotationRepository();
    yield call([annotationRepository, annotationRepository.saveAllAnnotations], annotations);
  } catch (e) {
    console.warn(e);
  }
}

function* handleLoadAnnotationsForCanvas(
  action: PayloadAction<SetCanvasFromComponentPayload>,
): Generator<Effect, void, Annotation[]> {
  const { collectionId, canvas } = action.payload;
  // load all the annotations of the collection
  const annotationRepository = getAnnotationRepository();
  const annotations = yield call(
    [annotationRepository, annotationRepository.getAnnotationsForCanvas],
    canvas.id,
    collectionId ?? '',
  );
  yield put(fetchAnnotationsSuccess(annotations));
}

export default function* annotationsSaga() {
  yield takeEvery(setCanvasFromComponent, handleLoadAnnotationsForCanvas);
  yield takeEvery(saveAnnotationRequest, handleSaveAnnotation);
  yield takeEvery(removeAnnotationRequest, handleRemoveAnnotation);
  yield takeEvery(removeAllCollectionAnnotationsRequest, handleRemoveAllCollectionAnnotations);
  yield takeEvery(removeAllCanvasAnnotationsRequest, handleRemoveAllCanvasAnnotations);
  yield takeEvery(removeAllRegionAnnotationsRequest, handleRemoveAllRegionAnnotations);
  yield takeEvery(updateAnnotationOrderValueRequest, handleUpdateAnnotationOrderValue);
  yield takeEvery(duplicateAnnotationsToAllPagesRequest, handleDuplicateAnnotationsToAllPages);
  yield takeEvery(duplicateAnnotationsEach2PagesRequest, handleDuplicateAnnotationsEach2Pages);
  yield takeEvery(recomputeRegionsRequest, handleRecomputeRegions);
  yield takeLatest(syncWithDB, handleSyncWithDB);
}

export {
  handleRemoveAllCanvasAnnotations,
  handleRemoveAllCollectionAnnotations,
  handleRemoveAnnotation,
  handleSaveAnnotation,
  handleUpdateAnnotationOrderValue,
};
