import { db } from '@/data/db';
import { Annotation } from '@/data/models/Annotation';
import { removeAllAnnotations, saveAllAnnotations } from '@/data/services/annotations';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, Effect, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import {
  addLinkBetweenAnnotationsRequest,
  addLinkBetweenAnnotationsSuccess,
  fetchAnnotationsSuccess,
  linkAnnotationsFailure,
  removeAllAnnotationsFailure,
  removeAllAnnotationsRequest,
  removeAllAnnotationsSuccess,
  removeAnnotationRequest,
  removeAnnotationSuccess,
  removeLinkBetweenAnnotationsRequest,
  removeLinkBetweenAnnotationsSuccess,
  saveAnnotationRequest,
  saveAnnotationSuccess,
  syncWithDB,
} from '../reducers/annotations';
import { setCanvasFromComponent, SetCanvasFromComponentPayload } from '../reducers/canvas';
import { getAnnotations } from '../selectors/annotations';

function* handleSaveAnnotationRequest(action: PayloadAction<Annotation>) {
  console.log('handleSaveAnnotationRequest - ', action.payload);
  try {
    yield call(() => db.annotations.put(action.payload));
    yield put(saveAnnotationSuccess(action.payload));
  } catch (e) {
    console.warn(e);
  }
}

function* handleRemoveAnnotationRequest(action: PayloadAction<string>) {
  try {
    yield call(() => db.annotations.delete(action.payload));
    yield put(removeAnnotationSuccess(action.payload));
  } catch (e) {
    console.warn(e);
  }
}

function* handleRemoveAllAnnotations(
  action: PayloadAction<string>,
): Generator<Effect, void, string[]> {
  const collectionId = action.payload;
  try {
    const canvasIds = yield call(removeAllAnnotations, collectionId);
    yield put(removeAllAnnotationsSuccess(canvasIds));
  } catch (e) {
    console.warn(e);
    yield put(removeAllAnnotationsFailure);
  }
}

function* handleSetCanvasFromComponent(
  action: PayloadAction<SetCanvasFromComponentPayload>,
): Generator<Effect, void, Annotation[]> {
  console.log('handleSetCanvasFromComponent - ', action.payload);
  if (action.payload.collectionId !== undefined) {
    try {
      const annotations = yield call(() =>
        db.annotations
          .where({
            canvasId: action.payload.canvas.id,
            collectionId: action.payload.collectionId,
          })
          .toArray(),
      );
      yield put(fetchAnnotationsSuccess(annotations));
    } catch (e) {
      console.warn(e);
    }
  }
}

function* handleAddLinkBetweenAnnotationsRequest(
  action: PayloadAction<{ source: string; target: string }>,
): Generator<Effect, void, Annotation> {
  const sourceAnnotation = yield call(() => db.annotations.get(action.payload.source));
  const targetAnnotation = yield call(() => db.annotations.get(action.payload.target));
  if (sourceAnnotation === undefined || targetAnnotation === undefined) {
    yield put(linkAnnotationsFailure('One or both annotations not found'));
    return;
  }
  sourceAnnotation.next = action.payload.target;
  targetAnnotation.previous = action.payload.source;
  try {
    yield call(() => db.annotations.put(sourceAnnotation));
    yield call(() => db.annotations.put(targetAnnotation));
    yield put(addLinkBetweenAnnotationsSuccess(action.payload));
  } catch (e) {
    console.warn(e);
    yield put(linkAnnotationsFailure('Failed to link annotations'));
  }
}

function* handleRemoveLinkBetweenAnnotationsRequest(
  action: PayloadAction<{ source: string; target: string }>,
): Generator<Effect, void, Annotation> {
  const sourceAnnotation = yield call(() => db.annotations.get(action.payload.source));
  const targetAnnotation = yield call(() => db.annotations.get(action.payload.target));
  if (sourceAnnotation === undefined || targetAnnotation === undefined) {
    yield put(linkAnnotationsFailure('One or both annotations not found'));
    return;
  }
  sourceAnnotation.next = undefined;
  targetAnnotation.previous = undefined;
  try {
    yield call(() => db.annotations.put(sourceAnnotation));
    yield call(() => db.annotations.put(targetAnnotation));
    yield put(removeLinkBetweenAnnotationsSuccess(action.payload));
  } catch (e) {
    console.warn(e);
    yield put(linkAnnotationsFailure('Failed to link annotations'));
  }
}

/*function* handleUpdateAnnotationValueRequest(
  action: PayloadAction<{ id: string; value: string }>,
): Generator<Effect, void, Annotation> {
  console.log('handleUpdateAnnotationValueRequest');

  const annotation = yield call(() => db.annotations.get(action.payload.id));
  if (annotation === undefined) {
    yield put(linkAnnotationsFailure('Annotation not found'));
    return;
  }
  const body = {
    purpose: 'tagging',
    value: action.payload.value,
    annotation: annotation.id,
    id: annotation.id + '-t', //TODO: revoir format
  };
  if (annotation.bodies[0].purpose === 'classifying') {
    annotation.bodies[1] = body;
  } else {
    annotation.bodies[0] = body;
  }
  try {
    yield call(() => db.annotations.put(annotation));
    yield put(updateAnnotationValueSuccess(action.payload));
  } catch (e) {
    console.warn(e);
    yield put(linkAnnotationsFailure('Failed to update annotation value'));
  }
}*/

function* handleSyncWithDB(
  action: PayloadAction<{ canvasId: string; collectionId: string }>,
): Generator<Effect, void, Annotation[]> {
  const { canvasId, collectionId } = action.payload;
  try {
    const annotations = yield select(getAnnotations, canvasId, collectionId);
    yield call(saveAllAnnotations, annotations);
  } catch (e) {
    console.warn(e);
  }
}

export default function* annotationsSaga() {
  yield takeEvery(saveAnnotationRequest, handleSaveAnnotationRequest);
  yield takeEvery(removeAnnotationRequest, handleRemoveAnnotationRequest);
  yield takeEvery(removeAllAnnotationsRequest, handleRemoveAllAnnotations);
  //charge les annotations d'un canvas lorsque l'on change de canvas
  yield takeLatest(setCanvasFromComponent, handleSetCanvasFromComponent);
  yield takeEvery(addLinkBetweenAnnotationsRequest, handleAddLinkBetweenAnnotationsRequest);
  yield takeEvery(removeLinkBetweenAnnotationsRequest, handleRemoveLinkBetweenAnnotationsRequest);
  // yield takeLatest(updateAnnotationValueRequest, handleUpdateAnnotationValueRequest);
  yield takeLatest(syncWithDB, handleSyncWithDB);
}
