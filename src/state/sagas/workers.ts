import {
  all,
  call,
  CallEffect,
  Effect,
  fork,
  put,
  PutEffect,
  takeLatest,
} from 'redux-saga/effects';

import { Annotation, ElementType, getAnnotationType } from '@/data/models/Annotation';
import { convertEdwinResult, EdwinBox } from '@/data/models/converters/edwinMagic';
import { convertPeroTranscriptionsToAnnotations } from '@/data/models/converters/peroConverter';
import { peroResultError, peroResultSchema } from '@/data/models/converters/peroSchema';
import { getAnnotationsForCanvas, saveAllAnnotations } from '@/data/services/annotations';
import { getImage } from '@/data/services/canvas';
import { getCanvasesByCollectionId } from '@/data/services/collections';
import { getErrorMessage } from '@/utils/utils';
import { Client } from '@gradio/client';
import { Canvas } from '@iiif/presentation-3';
import { PayloadAction } from '@reduxjs/toolkit';
import { PredictReturn } from 'node_modules/@gradio/client/dist/types';
import { fetchAnnotationsSuccess } from '../reducers/annotations';
import {
  fetchBatchLayoutRequest,
  fetchBatchOcrRequest,
  fetchLayoutPayload,
  fetchLayoutRequest,
  fetchOcrPayload,
  fetchOcrRequest,
  processError,
  processRunning,
  processStart,
  processSuccess,
} from '../reducers/workers';

function* handleFetchLayout({
  canvas,
  collectionId,
  originalWidth,
}: fetchLayoutPayload): Generator<CallEffect | PutEffect, void, Response> {
  try {
    if (canvas === undefined) {
      // yield put(processError({ url: canvas.id, error: 'Canvas or region is undefined' }));
      return;
    }

    yield put(processRunning(canvas.id));
    const image = getImage(canvas);

    const response: Response = yield call(
      fetch,
      // `http://localhost:3000/layout?image_url=${imageUrl}`,
      `https://api.mezanno.xyz/layout?image_url=${image.id}`,
    );
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = yield call([response, 'json']);
    console.log('data: ', data);

    yield put(processSuccess({ canvasId: canvas.id, result: data }));

    //convert the result into an array of Annotation
    const annotations = convertEdwinResult(
      data as unknown as EdwinBox[],
      canvas.id,
      collectionId,
      originalWidth,
    );
    //and send it to the redux store
    yield put(fetchAnnotationsSuccess(annotations));
  } catch (error) {
    console.error('Error fetching layout:', error);
    yield put(processError({ canvasId: canvas.id, error: getErrorMessage(error) }));
  }
}

function* handleFetchOcr({
  canvas,
  collectionId,
  region,
}: fetchOcrPayload): Generator<
  CallEffect | PutEffect,
  void,
  Client | PredictReturn | Annotation[]
> {
  if (canvas === undefined) {
    // yield put(processError({ url: canvas.id, error: 'Canvas or region is undefined' }));
    return;
  }
  yield put(processRunning(canvas.id));

  try {
    const image = getImage(canvas);

    let regions = JSON.stringify([]);
    if (region === undefined || region === null) {
      const annotations = (yield call(
        getAnnotationsForCanvas,
        canvas.id,
        collectionId,
      )) as Annotation[];
      const annotationRegions = annotations.filter(
        (a) => getAnnotationType(a) === ElementType.REGION,
      );
      if (annotationRegions.length > 0) {
        regions = JSON.stringify(
          annotationRegions
            .sort((a1, a2) => (a1.order ?? 0) - (a2.order ?? 0))
            .map((annotation) => {
              return {
                xtl: annotation.target.selector.geometry.bounds.minX,
                ytl: annotation.target.selector.geometry.bounds.minY,
                xbr: annotation.target.selector.geometry.bounds.maxX,
                ybr: annotation.target.selector.geometry.bounds.maxY,
              };
            }),
        );
      }
    } else {
      regions = JSON.stringify([
        {
          xtl: region?.left,
          ytl: region?.top,
          xbr: region?.left + region?.width,
          ybr: region?.top + region?.height,
        },
      ]);
    }

    const client = (yield call(() => Client.connect('https://api.mezanno.xyz/ocr/'))) as Client;
    const gradioResult = (yield call(() =>
      client.predict('/transcribe', { image_url: image.id, regions }),
    )) as PredictReturn;

    console.log(gradioResult.data);
    try {
      const peroResult = peroResultSchema.parse(gradioResult.data);
      console.log('peroResult: ', peroResult);

      const annotations = convertPeroTranscriptionsToAnnotations(
        peroResult,
        canvas.id,
        collectionId,
      );
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
    console.error('handleFetchOcr: ', error);
    yield put(processError({ canvasId: canvas.id, error: getErrorMessage(error) }));
  }
}

function* handleStartBatchLayoutProcess(
  action: PayloadAction<string>,
): Generator<Effect, void, Canvas[]> {
  const collectionId = action.payload;
  const canvases = yield call(getCanvasesByCollectionId, collectionId);
  if (canvases === undefined || canvases.length === 0) {
    // yield put(processError({ error: 'No canvases found' }));
    return;
  }
  for (const canvas of canvases) {
    yield put(processStart(canvas.id));
  }
  for (let i = 0; i < canvases.length; i++) {
    yield call(handleFetchLayout, {
      canvas: canvases[i],
      collectionId,
      originalWidth: canvases[i].width ?? 0,
    });
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
  for (const canvas of canvases) {
    yield put(processStart(canvas.id));
  }
  const batchSize = 10; // Number of canvases to process in parallel
  try {
    for (let i = 0; i < canvases.length; i += batchSize) {
      const batch = canvases.slice(i, i + batchSize);
      yield all(
        batch.map((canvas) => call(handleFetchOcr, { canvas, collectionId, region: undefined })),
      );
      // yield fork(handleFetchOcr, {
      //   canvas: canvases[i],
      //   region: undefined,
      // });
    }
  } catch (error) {
    console.error('Error fetching canvases:', error);
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
  yield takeLatest(fetchBatchLayoutRequest, handleStartBatchLayoutProcess);
}
