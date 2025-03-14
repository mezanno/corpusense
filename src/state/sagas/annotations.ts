import { db } from '@/data/db';
import { Annotation } from '@/data/models/Annotation';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, Effect, put, takeEvery, takeLatest } from 'redux-saga/effects';
import {
  addAnnotationRequest,
  fetchAnnotationsByCanvasId,
  fetchAnnotationsSuccess,
} from '../reducers/annotations';

function* handleAddAnnotation(action: PayloadAction<Annotation>) {
  yield console.log(action.payload);

  try {
    yield db.annotations.add(action.payload);
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

export default function* annotationsSaga() {
  yield takeEvery(addAnnotationRequest, handleAddAnnotation);
  yield takeLatest(fetchAnnotationsByCanvasId, handleFetchAnnotationsByCanvasId);
}
