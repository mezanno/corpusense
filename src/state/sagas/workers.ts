import { Annotation, ElementType, getAnnotationType } from '@/data/models/Annotation';
import { convertEdwinResult, EdwinBox } from '@/data/models/converters/edwinMagic';
import { convertPeroTranscriptionsToAnnotations } from '@/data/models/converters/peroConverter';
import { peroResultError, peroResultSchema } from '@/data/models/converters/peroSchema';
import {
  getAnnotationRepository,
  getCollectionRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { getImage } from '@/data/utils/canvas';
import { generateTextFromCanvas } from '@/data/utils/export';
import { generateSchema } from '@/data/utils/model';
import { getErrorMessage } from '@/utils/utils';
import { Client } from '@gradio/client';
import { Canvas } from '@iiif/presentation-3';
import { PayloadAction } from '@reduxjs/toolkit';
import FileSaver from 'file-saver';
import i18next from 'i18next';
import { PredictReturn } from 'node_modules/@gradio/client/dist/types';
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
import { fetchAnnotationsSuccess } from '../reducers/annotations';
import {
  fetchBatchDataAnalysisPayload,
  fetchBatchDataAnalysisRequest,
  fetchBatchLayoutRequest,
  fetchBatchOcrRequest,
  fetchDataAnalysisPayload,
  fetchDataAnalysisRequest,
  fetchLayoutPayload,
  fetchLayoutRequest,
  fetchOcrPayload,
  fetchOcrRequest,
  processError,
  processRunning,
  processStart,
  processSuccess,
} from '../reducers/workers';

function* handleDataAnalysis({
  canvasId,
  collectionId,
  model,
}: fetchDataAnalysisPayload): Generator<Effect, string | void, string | Response | object> {
  yield put(processRunning(canvasId));
  let text = (yield call(generateTextFromCanvas, canvasId, collectionId)) as string;
  text = text.replace('"', ''); //.replace('«', '').replace('»', '');
  if (text === undefined || text.length === 0) {
    console.log('No text found for this canvas');
    yield put(processError({ id: canvasId, error: i18next.t('error_export_no_text') }));
    return;
  }
  const apiKey = localStorage.getItem('mistralApiKey');
  if (apiKey === null) {
    console.log('No Mistral API key found');
    yield put(processError({ id: canvasId, error: i18next.t('error_no_mistral_key') }));
    return;
  }

  const schema = generateSchema(model);
  // console.log('Schema generated:', schema);
  console.log('Text length: ', text.length);

  const body = {
    model: 'ministral-8b-latest',
    messages: [
      {
        role: 'system',
        // content: `Voici une liste de données textuelles présentées dans ce format :\n\n${schema}\n\nRetourne moi cette liste qui correspond aux données présentes dans ce texte (sous forme d'un fichier JSON). Pour chaque élément, peux-tu ajouter un indice de confiance entre 0 et 1. Si un élément ne te semble pas pertient, garde-le et donne-lui un indice de confiance de 0.`,
        content: `Voici une liste de données textuelles présentées correspondant à ce format :\n\n${schema}\n\nRetourne moi la liste données présentes dans ce texte sous forme d'une table JSON bien structurée. Pour chaque élément, tu ajouteras un indice de confiance entre 0 et 1. Si un élément ne te semble pas pertient, garde-le et donne-lui un indice de confiance de 0. La réponse ne doit contenir que le JSON, sans explication ni commentaire.`,
      },
      {
        role: 'user',
        content: text,
      },
    ],
    temperature: 0,
    max_tokens: text.length * 2,
    response_format: { type: 'json_object' },
  };

  const response = (yield call(() =>
    fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }),
  )) as Response;
  const data = (yield call([response, 'json'])) as object;
  console.log('Response from Mistral:', data);

  yield put(processSuccess({ id: canvasId, result: 'toto' }));

  if (
    typeof data === 'object' &&
    data !== null &&
    'choices' in data &&
    Array.isArray(data.choices) &&
    data.choices.length > 0 &&
    'message' in data.choices[0]
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const message = data.choices[0].message as object;
    if ('content' in message && typeof message.content === 'string') {
      console.log('Response length : ', message.content.length);

      return message.content;
    }
  }
}

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

function* handleStartBatchDataAnalysisProcess(
  action: PayloadAction<fetchBatchDataAnalysisPayload>,
): Generator<Effect, void, Canvas[] | string> {
  const { collectionId, model } = action.payload;
  yield put(processRunning(collectionId));

  const collectionRepository = getCollectionRepository();
  const canvases = (yield call(
    [collectionRepository, collectionRepository.getCanvasesByCollectionId],
    collectionId,
  )) as Canvas[];
  if (canvases === undefined || canvases.length === 0) {
    // yield put(processError({ error: 'No canvases found' }));
    return;
  }
  for (const canvas of canvases) {
    yield put(processStart(canvas.id));
  }
  let allTheData: unknown[] = [];
  for (let i = 0; i < canvases.length; i++) {
    const dataInCanvas = (yield call(handleDataAnalysis, {
      canvasId: canvases[i].id,
      collectionId,
      model,
    })) as string;
    if (dataInCanvas !== undefined) {
      try {
        const dataParsed = JSON.parse(dataInCanvas) as unknown[];
        allTheData = [...allTheData, ...dataParsed];
      } catch (error) {
        //TODO: on fait quoi lorsque le json est invalide ?
        console.error('Error parsing dataInCanvas:', error);
      }
    }
  }

  yield call(
    FileSaver.saveAs,
    new Blob([JSON.stringify(allTheData)], { type: 'text/plain;charset=utf-8' }),
    'exported_data.json',
  );
  yield put(processSuccess({ id: collectionId, result: 'toto' }));
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

function* handleDataAnalysisProcess(action: PayloadAction<fetchDataAnalysisPayload>) {
  yield fork(handleDataAnalysis, action.payload);
}

export default function* workerSaga() {
  yield takeLatest(fetchLayoutRequest, handleStartProcess);
  yield takeLatest(fetchOcrRequest, handleStartOcrProcess);
  yield takeLatest(fetchBatchOcrRequest, handleStartBatchOcrProcess);
  yield takeLatest(fetchBatchLayoutRequest, handleStartBatchLayoutProcess);
  yield takeLatest(fetchDataAnalysisRequest, handleDataAnalysisProcess);
  yield takeLatest(fetchBatchDataAnalysisRequest, handleStartBatchDataAnalysisProcess);
}
