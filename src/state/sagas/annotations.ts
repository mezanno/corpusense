import { db } from '@/data/db';
import { Annotation } from '@/data/models/Annotation';
import { Canvas } from '@iiif/presentation-3';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, Effect, put, takeEvery, takeLatest } from 'redux-saga/effects';
import {
  addLinkBetweenAnnotationsRequest,
  addLinkBetweenAnnotationsSuccess,
  fetchAnnotationsByCanvasId,
  fetchAnnotationsSuccess,
  linkAnnotationsFailure,
  removeAnnotationRequest,
  removeAnnotationSuccess,
  removeLinkBetweenAnnotationsRequest,
  removeLinkBetweenAnnotationsSuccess,
  saveAnnotationRequest,
  saveAnnotationSuccess,
  updateAnnotationValueRequest,
  updateAnnotationValueSuccess,
} from '../reducers/annotations';
import { setCanvasFromComponent } from '../reducers/canvas';

function* handleSaveAnnotationRequest(action: PayloadAction<Annotation>) {
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

function* handleFetchAnnotationsByCanvasId(
  action: PayloadAction<string>,
): Generator<Effect, void, Annotation[]> {
  try {
    const annotations = yield call(() =>
      db.annotations.where('canvasId').equals(action.payload).toArray(),
    );
    yield put(fetchAnnotationsSuccess(annotations));
  } catch (e) {
    console.warn(e);
  }
}

function* handleSetCanvasFromComponent(
  action: PayloadAction<{ componentId: string; canvas: Canvas }>,
): Generator<Effect, void, Annotation[]> {
  try {
    const annotations = yield call(() =>
      db.annotations.where('canvasId').equals(action.payload.canvas.id).toArray(),
    );
    yield put(fetchAnnotationsSuccess(annotations));
  } catch (e) {
    console.warn(e);
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

function* handleUpdateAnnotationValueRequest(
  action: PayloadAction<{ id: string; value: string }>,
): Generator<Effect, void, Annotation> {
  const annotation = yield call(() => db.annotations.get(action.payload.id));
  if (annotation === undefined) {
    yield put(linkAnnotationsFailure('Annotation not found'));
    return;
  }
  if (annotation.bodies[0].purpose === 'classifying') {
    annotation.bodies[1] = {
      purpose: 'tagging',
      value: action.payload.value,
    };
  } else {
    annotation.bodies[0] = {
      purpose: 'tagging',
      value: action.payload.value,
    };
  }
  try {
    yield call(() => db.annotations.put(annotation));
    yield put(updateAnnotationValueSuccess(action.payload));
  } catch (e) {
    console.warn(e);
    yield put(linkAnnotationsFailure('Failed to update annotation value'));
  }
}

export default function* annotationsSaga() {
  yield takeEvery(saveAnnotationRequest, handleSaveAnnotationRequest);
  yield takeEvery(removeAnnotationRequest, handleRemoveAnnotationRequest);
  //TODO! Surement inutile désormais
  yield takeLatest(fetchAnnotationsByCanvasId, handleFetchAnnotationsByCanvasId);
  //charge les annotations d'un canvas lorsque l'on change de canvas
  yield takeLatest(setCanvasFromComponent, handleSetCanvasFromComponent);
  yield takeEvery(addLinkBetweenAnnotationsRequest, handleAddLinkBetweenAnnotationsRequest);
  yield takeEvery(removeLinkBetweenAnnotationsRequest, handleRemoveLinkBetweenAnnotationsRequest);
  yield takeLatest(updateAnnotationValueRequest, handleUpdateAnnotationValueRequest);
}
