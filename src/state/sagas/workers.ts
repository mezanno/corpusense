import { call, CallEffect, fork, put, PutEffect, takeEvery } from 'redux-saga/effects';

import { convertEdwinResult, EdwinBox } from '@/data/models/converters/edwinMagic';
import { PayloadAction } from '@reduxjs/toolkit';
import { fetchAnnotationsSuccess } from '../reducers/annotations';
import {
  processError,
  processSuccess,
  startProcess,
  StartProcessPayload,
} from '../reducers/workers';

function* fetchLayout({
  imageUrl,
  canvasId,
  originalWidth,
}: StartProcessPayload): Generator<CallEffect | PutEffect, void, Response> {
  try {
    console.log('fetchLayout: ', imageUrl);

    const response: Response = yield call(
      fetch,
      `http://localhost:3000/layout?image_url=${imageUrl}`,
    );
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = yield call([response, 'json']);
    console.log('data: ', data);

    yield put(processSuccess({ url: imageUrl, result: data }));

    //convert the result into an array of Annotation
    const annotations = convertEdwinResult(data as unknown as EdwinBox[], canvasId, originalWidth);
    //and send it to the redux store
    yield put(fetchAnnotationsSuccess(annotations));
  } catch (error) {
    console.error('Error fetching layout:', error);
    yield put(processError({ url: imageUrl, error: error as string }));
  }
}

function* handleStartProcess(action: PayloadAction<StartProcessPayload>) {
  yield fork(fetchLayout, action.payload);
}

export default function* workerSaga() {
  yield takeEvery(startProcess.type, handleStartProcess);
}
