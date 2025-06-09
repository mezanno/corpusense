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
  setResults,
  setWorkers,
  setWorkerStatus,
  startWorkerProcess,
  StartWorkerProcessPayload,
} from '../reducers/workers';
import { loadPluginSagas, PluginSaga } from './plugins/loader';

const pluginSagas: Record<string, PluginSaga> = loadPluginSagas();

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
    yield put(processSuccess({ id: canvas.id, result: data }));
  } catch (error) {
    console.error('Error fetching layout:', error);
    yield put(processError({ id: canvas.id, error: getErrorMessage(error) }));
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
      // console.log('peroResult: ', peroResult);
      const annotations = convertPeroTranscriptionsToAnnotations(
        peroResult,
        canvas.id,
        collectionId,
      );
      yield put(fetchAnnotationsSuccess(annotations));
      const annotationRepository = getAnnotationRepository();
      yield call([annotationRepository, annotationRepository.saveAllAnnotations], annotations);
      yield put(processSuccess({ id: canvas.id, result: 'toto' }));
    } catch (error) {
      try {
        const peroError = peroResultError.parse(gradioResult.data);
        console.error('peroError: ', peroError[0].result.error);
        yield put(processError({ id: canvas.id, error: peroError[0].result.error }));
      } catch (err) {
        console.error('Error parsing peroResult:', err);
        yield put(processError({ id: canvas.id, error: getErrorMessage(err) }));
      }
    }
  } catch (error) {
    console.error('handleFetchOcr: ', error);
    yield put(processError({ id: canvas.id, error: getErrorMessage(error) }));
  }
}

function* handleStartBatchLayoutProcess(
  action: PayloadAction<string>,
): Generator<Effect, void, Canvas[]> {
  const collectionId = action.payload;
  yield put(processRunning(collectionId));

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
    yield put(processStart(canvas.id));
  }
  for (let i = 0; i < canvases.length; i++) {
    yield call(handleFetchLayout, {
      canvas: canvases[i],
      collectionId,
      originalWidth: canvases[i].width ?? 0,
    });
  }
  yield put(processSuccess({ id: collectionId, result: 'toto' }));
}

function* handleStartBatchOcrProcess(
  action: PayloadAction<string>,
): Generator<Effect, void, Canvas[]> {
  const collectionId = action.payload;
  yield put(processRunning(collectionId));

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
    yield put(processSuccess({ id: collectionId, result: 'toto' }));
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

// function* handleDataAnalysisProcess(action: PayloadAction<fetchDataAnalysisPayload>) {
//   yield fork(handleDataAnalysis, action.payload);
// }

function* handleStartWorkerProcess(action: PayloadAction<StartWorkerProcessPayload>) {
  const { workerName, params } = action.payload;
  if (pluginSagas[workerName] === undefined) {
    console.warn(`No plugin saga found for ${workerName}`);
    return;
  }
  const workerRepository = getWorkerRepository();
  const saga = pluginSagas[workerName];
  let worker = {
    id: uuid(),
    name: workerName,
    scope: params.scope,
    status: WorkerStatus.INPROGRESS,
    createdAt: new Date(),
  };
  try {
    yield call([workerRepository, workerRepository.add], worker);
    yield put(setWorkerStatus(worker));

    params.workerId = worker.id;
    yield call(saga.run, params);

    worker = { ...worker, status: WorkerStatus.COMPLETED };
    yield call([workerRepository, workerRepository.update], worker);
  } catch (error) {
    console.error(`Error in plugin saga for ${workerName}:`, error);
    worker = { ...worker, status: WorkerStatus.ERROR };
    yield call([workerRepository, workerRepository.update], worker);
  }
  yield put(setWorkerStatus(worker));
}

function* handleExportWorkerResult(
  action: PayloadAction<Worker>,
): Generator<Effect, void, Result[]> {
  const worker = action.payload;
  const resultRepository = getResultRepository();
  const results = yield call([resultRepository, resultRepository.selectByWorkerId], worker.id);
  if (results.length === 0) {
    //TODO! afficher message d'erreur dans l'UI
    console.warn(`No results found for worker ${worker.id}`);
    return;
  }
  const saga = pluginSagas[worker.name];
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
  // yield takeLatest(fetchDataAnalysisRequest, handleDataAnalysisProcess);
  // yield takeLatest(fetchBatchDataAnalysisRequest, handleStartBatchDataAnalysisProcess);
  yield takeEvery(startWorkerProcess, handleStartWorkerProcess);
  yield takeEvery(exportWorkerResultRequest, handleExportWorkerResult);
}

export { fetchWorkers };
