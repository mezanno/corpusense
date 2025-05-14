import { Annotation, ElementType, getAnnotationType } from '@/data/models/Annotation';
import { getAnnotationRepository } from '@/data/repositories/indexeddb/dbFactory';
import { contains } from '@/data/utils/annotations';
import { PayloadAction } from '@reduxjs/toolkit';
import { isEqual } from 'lodash';
import { call, Effect, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import {
  removeAllAnnotationsFailure,
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
      //compute the order value if not set or if set to -1
      //TODO : this should be done in the repository
      let newOrder = annotationToSave.order;
      if (
        (annotationToSave.order === undefined || annotationToSave.order === -1) &&
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
        newOrder = regions.length > 0 ? Math.max(...regions) + 1 : 0;
      }
      const newAnnotation = { ...annotationToSave, order: newOrder };
      yield call([annotationRepository, annotationRepository.updateAnnotation], newAnnotation);
      yield put(saveAnnotationSuccess(newAnnotation));
    }
  } catch (e) {
    console.warn(e);
  }
}

function* handleRemoveAnnotation(action: PayloadAction<string>) {
  try {
    const annotationRepository = getAnnotationRepository();
    yield call([annotationRepository, annotationRepository.removeById], action.payload);
    yield put(removeAnnotationSuccess(action.payload));
  } catch (e) {
    console.warn(e);
  }
}

function* handleRemoveAllCollectionAnnotations(
  action: PayloadAction<string>,
): Generator<Effect, void, string[]> {
  const collectionId = action.payload;
  try {
    const annotationRepository = getAnnotationRepository();
    const annotationIds = yield call(
      [annotationRepository, annotationRepository.removeByCollectionId],
      collectionId,
    );
    yield put(removeAllAnnotationsSuccess(annotationIds));
  } catch (e) {
    console.warn(e);
    yield put(removeAllAnnotationsFailure);
  }
}

function* handleRemoveAllCanvasAnnotations(
  action: PayloadAction<{ canvasId: string; collectionId: string }>,
): Generator<Effect, void, string[]> {
  try {
    const { canvasId, collectionId } = action.payload;
    const annotationRepository = getAnnotationRepository();
    const annotationIds = yield call(
      [annotationRepository, annotationRepository.removeByCanvasId],
      canvasId,
      collectionId,
    );
    yield put(removeAllAnnotationsSuccess(annotationIds));
  } catch (e) {
    console.warn(e);
    yield put(removeAllAnnotationsFailure);
  }
}

function* handleRemoveAllRegionAnnotations(
  action: PayloadAction<Annotation>,
): Generator<Effect, void, Annotation[]> {
  const annotation = action.payload;
  if (getAnnotationType(annotation) !== ElementType.REGION) {
    throw new Error('Annotation is not a region');
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
    yield put(removeAllAnnotationsFailure);
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

export default function* annotationsSaga() {
  yield takeEvery(saveAnnotationRequest, handleSaveAnnotation);
  yield takeEvery(removeAnnotationRequest, handleRemoveAnnotation);
  yield takeEvery(removeAllCollectionAnnotationsRequest, handleRemoveAllCollectionAnnotations);
  yield takeEvery(removeAllCanvasAnnotationsRequest, handleRemoveAllCanvasAnnotations);
  yield takeEvery(removeAllRegionAnnotationsRequest, handleRemoveAllRegionAnnotations);
  yield takeEvery(updateAnnotationOrderValueRequest, handleUpdateAnnotationOrderValue);
  yield takeLatest(syncWithDB, handleSyncWithDB);
}

export {
  handleRemoveAllCanvasAnnotations,
  handleRemoveAllCollectionAnnotations,
  handleRemoveAnnotation,
  handleSaveAnnotation,
  handleUpdateAnnotationOrderValue,
};
