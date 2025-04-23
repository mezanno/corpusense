import { call, CallEffect, Effect, fork, put, PutEffect, takeLatest } from 'redux-saga/effects';

import { convertEdwinResult, EdwinBox } from '@/data/models/converters/edwinMagic';
import { convertPeroTranscriptionsToAnnotations } from '@/data/models/converters/peroConverter';
import { peroResultError, peroResultSchema } from '@/data/models/converters/peroSchema';
import { saveAllAnnotations } from '@/data/services/annotations';
import { getCanvasesByCollectionId } from '@/data/services/collections';
import { getErrorMessage } from '@/utils/utils';
import { Client } from '@gradio/client';
import { Canvas, IIIFExternalWebResource } from '@iiif/presentation-3';
import { PayloadAction } from '@reduxjs/toolkit';
import { PredictReturn } from 'node_modules/@gradio/client/dist/types';
import { fetchAnnotationsSuccess } from '../reducers/annotations';
import {
  fetchBatchOcrRequest,
  fetchLayoutPayload,
  fetchLayoutRequest,
  fetchOcrPayload,
  fetchOcrRequest,
  processError,
  processStart,
  processSuccess,
} from '../reducers/workers';

function* handleFetchLayout({
  imageUrl,
  canvasId,
  originalWidth,
}: fetchLayoutPayload): Generator<CallEffect | PutEffect, void, Response> {
  try {
    console.log('fetchLayout: ', imageUrl);

    const response: Response = yield call(
      fetch,
      // `http://localhost:3000/layout?image_url=${imageUrl}`,
      `https://api.mezanno.xyz/layout?image_url=${imageUrl}`,
    );
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = yield call([response, 'json']);
    console.log('data: ', data);

    yield put(processSuccess({ canvasId: imageUrl, result: data }));

    //convert the result into an array of Annotation
    const annotations = convertEdwinResult(data as unknown as EdwinBox[], canvasId, originalWidth);
    //and send it to the redux store
    yield put(fetchAnnotationsSuccess(annotations));
  } catch (error) {
    console.error('Error fetching layout:', error);
    yield put(processError({ canvasId: imageUrl, error: getErrorMessage(error) }));
  }
}

function* handleFetchOcr({
  canvas,
  region,
}: fetchOcrPayload): Generator<CallEffect | PutEffect, void, Client | PredictReturn> {
  if (canvas === undefined) {
    // yield put(processError({ url: canvas.id, error: 'Canvas or region is undefined' }));
    return;
  }
  yield put(processStart(canvas.id));
  const image = canvas.items?.[0].items?.[0].body as IIIFExternalWebResource;
  if (image === undefined || image.id === undefined) {
    yield put(processError({ canvasId: canvas.id, error: 'Image is undefined' }));
    return;
  }

  try {
    const client = (yield call(() => Client.connect('https://api.mezanno.xyz/ocr/'))) as Client;
    const regions =
      region === undefined || region === null
        ? JSON.stringify([])
        : JSON.stringify([
            {
              xtl: region?.left,
              ytl: region?.top,
              xbr: region?.left + region?.width,
              ybr: region?.top + region?.height,
            },
          ]);
    const gradioResult = (yield call(() =>
      client.predict('/transcribe', { image_url: image.id, regions }),
    )) as PredictReturn;

    console.log(gradioResult.data);
    try {
      const peroResult = peroResultSchema.parse(gradioResult.data);
      const annotations = convertPeroTranscriptionsToAnnotations(peroResult, canvas.id);
      yield put(fetchAnnotationsSuccess(annotations));
      yield call(saveAllAnnotations, annotations);
      yield put(processSuccess({ canvasId: canvas.id, result: 'toto' }));
    } catch (error) {
      try {
        const peroError = peroResultError.parse(gradioResult.data);
        console.error('peroError: ', peroError[0].result.error);
        yield put(processError({ canvasId: canvas.id, error: peroError[0].result.error }));
      } catch (err) {
        console.error('Error parsing peroResult:', err);
        yield put(processError({ canvasId: canvas.id, error: getErrorMessage(err) }));
      }
    }
  } catch (error) {
    console.error(error);
    yield put(processError({ canvasId: canvas.id, error: getErrorMessage(error) }));
  }
}

function* handleStartBatchOcrProcess(
  action: PayloadAction<string>,
): Generator<Effect, void, Canvas[]> {
  const collectionId = action.payload;
  const canvases = yield call(getCanvasesByCollectionId, collectionId);
  if (canvases === undefined || canvases.length === 0) {
    // yield put(processError({ error: 'No canvases found' }));
    return;
  }
  for (let i = 0; i < canvases.length; i++) {
    yield fork(handleFetchOcr, {
      canvas: canvases[i],
      region: undefined,
    });
  }
}

function* handleStartProcess(action: PayloadAction<fetchLayoutPayload>) {
  yield fork(handleFetchLayout, action.payload);
}

function* handleStartOcrProcess(action: PayloadAction<fetchOcrPayload>) {
  yield fork(handleFetchOcr, action.payload);
}

export default function* workerSaga() {
  yield takeLatest(fetchLayoutRequest, handleStartProcess);
  yield takeLatest(fetchOcrRequest, handleStartOcrProcess);
  yield takeLatest(fetchBatchOcrRequest, handleStartBatchOcrProcess);
}
