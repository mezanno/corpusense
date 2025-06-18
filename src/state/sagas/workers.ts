import { Annotation, ElementType, getAnnotationType } from '@/data/models/Annotation';
import { convertEdwinResult, EdwinBox } from '@/data/models/converters/edwinMagic';
import { convertPeroTranscriptionsToAnnotations } from '@/data/models/converters/peroConverter';
import { peroResultError, peroResultSchema } from '@/data/models/converters/peroSchema';
import { Result } from '@/data/models/Result';
import { Worker, WorkerStatus } from '@/data/models/Worker';
import {
  getAnnotationRepository,
  getCollectionRepository,
  getResultRepository,
  getWorkerRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { getImage } from '@/data/utils/canvas';
import i18n from '@/i18n';
import { getErrorMessage } from '@/utils/utils';
import { Client } from '@gradio/client';
import { Canvas } from '@iiif/presentation-3';
import { PayloadAction } from '@reduxjs/toolkit';
import { PredictReturn } from 'node_modules/@gradio/client/dist/types';
import {
  all,
  call,
  CallEffect,
  Effect,
  fork,
  put,
  PutEffect,
  takeEvery,
  takeLatest,
} from 'redux-saga/effects';
import { v4 as uuid } from 'uuid';
import { fetchAnnotationsSuccess } from '../reducers/annotations';
import { pushError, pushInfo } from '../reducers/events';
import {
  exportWorkerResultRequest,
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
  recoverWorkerRequest,
  setResults,
  setWorkers,
  setWorkerStatus,
  startWorkerProcess,
  StartWorkerProcessPayload,
} from '../reducers/workers';
import { loadWorkerPlugins, WorkerPlugin } from './plugins/loader';

const workerPlugins: Record<string, WorkerPlugin> = loadWorkerPlugins();

function* handleFetchLayout({
  canvas,
  collectionId,
  originalWidth,
}: fetchLayoutPayload): Generator<CallEffect | PutEffect, void, Response> {
  yield put(pushInfo(i18n.t('info_start_layout', { canvas })));
  try {
    if (canvas === undefined) {
      // yield put(processError({ url: canvas.id, error: 'Canvas or region is undefined' }));
      return;
    }

    yield put(processRunning({ collectionId, canvasId: canvas.id }));
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
    //convert the result into an array of Annotation
    const annotations = convertEdwinResult(
      data as unknown as EdwinBox[],
      canvas.id,
      collectionId,
      originalWidth,
    );
    //and send it to the redux store
    yield put(fetchAnnotationsSuccess(annotations));
    const annotationRepository = getAnnotationRepository();
    yield call([annotationRepository, annotationRepository.saveAllAnnotations], annotations);
    yield put(processSuccess({ collectionId, canvasId: canvas.id }));
  } catch (error) {
    console.error('Error fetching layout:', error);
    yield put(processError({ collectionId, canvasId: canvas.id }));
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
  yield put(pushInfo(i18n.t('info_start_ocr', { canvas })));
  if (canvas === undefined) {
    // yield put(processError({ url: canvas.id, error: 'Canvas or region is undefined' }));
    return;
  }
  yield put(processRunning({ collectionId, canvasId: canvas.id }));

  try {
    const image = getImage(canvas);

    let regions = JSON.stringify([]);
    if (region === undefined || region === null) {
      const annotationRepository = getAnnotationRepository();
      const annotations = (yield call(
        [annotationRepository, annotationRepository.getAnnotationsForCanvas],
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
      const annotations = convertPeroTranscriptionsToAnnotations(
        peroResult,
        canvas.id,
        collectionId,
      );
      yield put(fetchAnnotationsSuccess(annotations));
      const annotationRepository = getAnnotationRepository();
      yield call([annotationRepository, annotationRepository.saveAllAnnotations], annotations);
      yield put(processSuccess({ collectionId, canvasId: canvas.id }));
    } catch (error) {
      try {
        const peroError = peroResultError.parse(gradioResult.data);
        console.error('peroError: ', peroError[0].result.error);
        // yield put(processError({ id: canvas.id, error: peroError[0].result.error }));
        yield put(processError({ collectionId, canvasId: canvas.id }));
      } catch (err) {
        console.error('Error parsing peroResult:', err);
        // yield put(processError({ id: canvas.id, error: getErrorMessage(err) }));
        yield put(processError({ collectionId, canvasId: canvas.id }));
      }
    }
  } catch (error) {
    console.error('handleFetchOcr: ', error);
    // yield put(processError({ id: canvas.id, error: getErrorMessage(error) }));
    yield put(processError({ collectionId, canvasId: canvas.id }));
  }
}

function* handleStartBatchLayoutProcess(
  action: PayloadAction<string>,
): Generator<Effect, void, Canvas[]> {
  const collectionId = action.payload;
  yield put(processRunning({ collectionId }));

  const collectionRepository = getCollectionRepository();
  const canvases = yield call(
    [collectionRepository, collectionRepository.getCanvasesByCollectionId],
    collectionId,
  );
  if (canvases === undefined || canvases.length === 0) {
    // yield put(processError({ error: 'No canvases found' }));
    return;
  }
  for (const canvas of canvases) {
    yield put(processStart({ collectionId, canvasId: canvas.id }));
  }
  for (let i = 0; i < canvases.length; i++) {
    yield call(handleFetchLayout, {
      canvas: canvases[i],
      collectionId,
      originalWidth: canvases[i].width ?? 0,
    });
  }
  yield put(processSuccess({ collectionId }));
}

function* handleStartBatchOcrProcess(
  action: PayloadAction<string>,
): Generator<Effect, void, Canvas[]> {
  const collectionId = action.payload;
  yield put(processRunning({ collectionId }));

  const collectionRepository = getCollectionRepository();
  const canvases = yield call(
    [collectionRepository, collectionRepository.getCanvasesByCollectionId],
    collectionId,
  );
  if (canvases === undefined || canvases.length === 0) {
    // yield put(processError({ error: 'No canvases found' }));
    return;
  }
  for (const canvas of canvases) {
    yield put(processStart({ collectionId, canvasId: canvas.id }));
  }
  const batchSize = 10; // Number of canvases to process in parallel
  try {
    for (let i = 0; i < canvases.length; i += batchSize) {
      const batch = canvases.slice(i, i + batchSize);
      yield all(
        batch.map((canvas) => call(handleFetchOcr, { canvas, collectionId, region: undefined })),
      );
    }
    yield put(processSuccess({ collectionId }));
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

function* handleStartWorkerProcess(action: PayloadAction<StartWorkerProcessPayload>) {
  const { workerName, params } = action.payload;
  if (workerPlugins[workerName] === undefined) {
    console.warn(`No plugin saga found for ${workerName}`);
    return;
  }

  const worker = {
    id: uuid(),
    name: workerName,
    scope: params.scope,
    status: WorkerStatus.INPROGRESS,
    createdAt: new Date(),
    params,
  };

  yield call(startWorker, worker);
}

function* startWorker(worker: Worker, isRecovering = false) {
  const workerRepository = getWorkerRepository();
  const saga = workerPlugins[worker.name];
  try {
    if (isRecovering) {
      worker = { ...worker, status: WorkerStatus.INPROGRESS };
      yield call([workerRepository, workerRepository.update], worker);
    } else {
      yield call([workerRepository, workerRepository.add], worker);
    }
    yield put(setWorkerStatus(worker));
    yield call(saga.run, isRecovering, worker.params);

    worker = { ...worker, status: WorkerStatus.COMPLETED };
    yield call([workerRepository, workerRepository.update], worker);
  } catch (error) {
    console.error(`Error in plugin saga for ${worker.name}:`, error);
    worker = { ...worker, status: WorkerStatus.ERROR };
    yield call([workerRepository, workerRepository.update], worker);
    yield put(pushError(`Error in plugin saga for ${worker.name}: ${getErrorMessage(error)}`));
  }
  yield put(setWorkerStatus(worker));
}

function* handleRecoverWorker(action: PayloadAction<Worker>) {
  const worker = action.payload;
  yield call(startWorker, worker, true);
}

function* handleExportWorkerResult(
  action: PayloadAction<Worker>,
): Generator<Effect, void, Result[]> {
  const worker = action.payload;
  const resultRepository = getResultRepository();
  const results = yield call([resultRepository, resultRepository.selectByWorkerName], worker.name);
  if (results.length === 0) {
    //TODO! afficher message d'erreur dans l'UI
    console.warn(`No results found for worker ${worker.id}`);
    return;
  }
  const saga = workerPlugins[worker.name];
  if (saga !== undefined && saga !== null && saga.export) {
    yield call(saga.export, results);
  }
}

function* fetchWorkers(): Generator<Effect, void, Worker[] | Result[]> {
  const workerRepository = getWorkerRepository();
  const workers = (yield call([workerRepository, workerRepository.selectAll])) as Worker[];
  yield put(setWorkers(workers));

  const resultRepository = getResultRepository();
  const results = (yield call([resultRepository, resultRepository.selectAll])) as Result[];
  yield put(setResults(results));
}

export default function* workerSaga() {
  yield takeLatest(fetchLayoutRequest, handleStartProcess);
  yield takeLatest(fetchOcrRequest, handleStartOcrProcess);
  yield takeLatest(fetchBatchOcrRequest, handleStartBatchOcrProcess);
  yield takeLatest(fetchBatchLayoutRequest, handleStartBatchLayoutProcess);
  yield takeEvery(startWorkerProcess, handleStartWorkerProcess);
  yield takeEvery(exportWorkerResultRequest, handleExportWorkerResult);
  yield takeEvery(recoverWorkerRequest, handleRecoverWorker);
}

export { fetchWorkers };
