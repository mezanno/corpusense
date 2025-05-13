import { Annotation, getAnnotationType } from '@/data/models/Annotation';
import { getAnnotationRepository } from '@/data/repositories/indexeddb/dbFactory';
import { PayloadAction } from '@reduxjs/toolkit';
import { isEqual } from 'lodash';
import { call, Effect, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import {
  removeAllAnnotationsFailure,
  removeAllAnnotationsSuccess,
  removeAnnotationRequest,
  removeAnnotationSuccess,
  removeCanvasAnnotationsRequest,
  removeCollectionAnnotationsRequest,
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

function* handleRemoveCollectionAnnotations(
  action: PayloadAction<string>,
): Generator<Effect, void, string[]> {
  const collectionId = action.payload;
  try {
    const annotationRepository = getAnnotationRepository();
    const canvasIds = yield call(
      [annotationRepository, annotationRepository.removeByCollectionId],
      collectionId,
    );
    yield put(removeAllAnnotationsSuccess(canvasIds));
  } catch (e) {
    console.warn(e);
    yield put(removeAllAnnotationsFailure);
  }
}

function* handleRemoveCanvasAnnotations(
  action: PayloadAction<{ canvasId: string; collectionId: string }>,
): Generator<Effect, void, void> {
  try {
    const { canvasId, collectionId } = action.payload;
    const annotationRepository = getAnnotationRepository();
    yield call(
      [annotationRepository, annotationRepository.removeByCanvasId],
      canvasId,
      collectionId,
    );
    yield put(removeAllAnnotationsSuccess([canvasId]));
  } catch (e) {
    console.warn(e);
    yield put(removeAllAnnotationsFailure);
  }
}

// function* handleAddLinkBetweenAnnotations(
//   action: PayloadAction<{ source: string; target: string }>,
// ): Generator<Effect, void, Annotation> {
//   const annotationRepository = getAnnotationRepository();
//   const sourceAnnotation = yield call(
//     [annotationRepository, annotationRepository.getById],
//     action.payload.source,
//   );
//   const targetAnnotation = yield call(
//     [annotationRepository, annotationRepository.getById],
//     action.payload.target,
//   );
//   if (sourceAnnotation === undefined || targetAnnotation === undefined) {
//     yield put(linkAnnotationsFailure('One or both annotations not found'));
//     return;
//   }
//   sourceAnnotation.next = action.payload.target;
//   targetAnnotation.previous = action.payload.source;
//   try {
//     yield call([annotationRepository, annotationRepository.updateAnnotation], sourceAnnotation);
//     yield call([annotationRepository, annotationRepository.updateAnnotation], targetAnnotation);
//     yield put(addLinkBetweenAnnotationsSuccess(action.payload));
//   } catch (e) {
//     console.warn(e);
//     yield put(linkAnnotationsFailure('Failed to link annotations'));
//   }
// }

// function* handleRemoveLinkBetweenAnnotations(
//   action: PayloadAction<{ source: string; target: string }>,
// ): Generator<Effect, void, Annotation> {
//   const annotationRepository = getAnnotationRepository();
//   const sourceAnnotation = yield call(
//     [annotationRepository, annotationRepository.getById],
//     action.payload.source,
//   );
//   const targetAnnotation = yield call(
//     [annotationRepository, annotationRepository.getById],
//     action.payload.target,
//   );
//   if (sourceAnnotation === undefined || targetAnnotation === undefined) {
//     yield put(linkAnnotationsFailure('One or both annotations not found'));
//     return;
//   }
//   sourceAnnotation.next = undefined;
//   targetAnnotation.previous = undefined;
//   try {
//     yield call([annotationRepository, annotationRepository.updateAnnotation], sourceAnnotation);
//     yield call([annotationRepository, annotationRepository.updateAnnotation], targetAnnotation);
//     yield put(removeLinkBetweenAnnotationsSuccess(action.payload));
//   } catch (e) {
//     console.warn(e);
//     yield put(linkAnnotationsFailure('Failed to link annotations'));
//   }
// }

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
  yield takeEvery(removeCollectionAnnotationsRequest, handleRemoveCollectionAnnotations);
  yield takeEvery(removeCanvasAnnotationsRequest, handleRemoveCanvasAnnotations);
  // yield takeEvery(addLinkBetweenAnnotationsRequest, handleAddLinkBetweenAnnotations);
  // yield takeEvery(removeLinkBetweenAnnotationsRequest, handleRemoveLinkBetweenAnnotations);
  yield takeEvery(updateAnnotationOrderValueRequest, handleUpdateAnnotationOrderValue);
  yield takeLatest(syncWithDB, handleSyncWithDB);
}

export {
  handleRemoveAnnotation,
  handleRemoveCanvasAnnotations,
  handleRemoveCollectionAnnotations,
  handleSaveAnnotation,
  handleUpdateAnnotationOrderValue,
};
