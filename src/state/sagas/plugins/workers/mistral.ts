import { DataModel } from '@/data/models/DataModel';
import { Result, ResultCreateDTO } from '@/data/models/Result';
import { isCanvasScope, isCollectionScope } from '@/data/models/Worker';
import {
  getCollectionRepository,
  getResultRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { generateTextFromCanvas } from '@/data/utils/export';
import { generateSchema } from '@/data/utils/model';
import {
  PluginParams,
  processError,
  processRunning,
  processStart,
  processSuccess,
} from '@/state/reducers/workers';
import { Canvas } from '@iiif/presentation-3';
import FileSaver from 'file-saver';
import i18next from 'i18next';
import { json2csv } from 'json-2-csv';
import { call, Effect, put } from 'redux-saga/effects';

export const pluginName = 'mistral';

export function* startSingleMistralAnalysisProcess(
  canvasId: string,
  collectionId: string,
  model: DataModel,
  workerName: string,
): Generator<Effect, string | void, string | Response | object> {
  yield put(processRunning({ collectionId, canvasId }));
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
  const body = {
    model: 'ministral-8b-latest',
    messages: [
      {
        role: 'system',
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

  yield put(processSuccess({ collectionId, canvasId }));

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
      //save the result in the IndexedDB
      const result: ResultCreateDTO = {
        scope: { canvasId, collectionId },
        workerName,
        value: message.content,
      };
      const resultRepository = getResultRepository();
      yield call([resultRepository, resultRepository.addResult], result);

      return message.content;
    }
  }
  throw new Error('Invalid response format from Mistral API');
}

function* startBatchMistralAnalysisProcess(
  collectionId: string,
  model: DataModel,
  workerName: string,
): Generator<Effect, void, Canvas[] | string> {
  console.log(
    `Mistral plugin saga started for collection ${collectionId} with model ${model.name}`,
  );

  yield put(processRunning({ collectionId }));

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
    yield put(processStart({ collectionId, canvasId: canvas.id }));
  }
  let allTheData: unknown[] = [];
  for (let i = 0; i < canvases.length; i++) {
    try {
      const dataInCanvas = (yield call(
        startSingleMistralAnalysisProcess,
        canvases[i].id,
        collectionId,
        model,
        workerName,
      )) as string;
      try {
        const dataParsed = JSON.parse(dataInCanvas) as unknown[];
        allTheData = [...allTheData, ...dataParsed];
      } catch (error) {
        //TODO: on fait quoi lorsque le json est invalide ?
        console.error('Error parsing dataInCanvas:', error);
      }
    } catch (error) {
      console.warn('Error processing canvas:', canvases[i].id, error);
    }
  }

  yield call(
    FileSaver.saveAs,
    new Blob([JSON.stringify(allTheData)], { type: 'text/plain;charset=utf-8' }),
    'exported_data.json',
  );
  yield put(processSuccess({ collectionId }));
}

//type guard to check if params has scope and model
function hasScopeAndModel(
  params: PluginParams,
): params is PluginParams & { model: DataModel } & { workerName: string } {
  return 'scope' in params && 'model' in params && 'workerName' in params;
}

//entry point for the Mistral plugin saga (default export)
export default function* mistralSaga(params: PluginParams) {
  if (!hasScopeAndModel(params)) {
    console.log('Invalid parameters for Mistral plugin saga:', params);
    throw new Error('Invalid parameters for Mistral plugin saga');
  }
  const { scope, model, workerName } = params;
  if (workerName === undefined) {
    console.warn('No workerName provided for Mistral plugin saga');
    throw new Error('No workerName provided for Mistral plugin saga');
  }
  if (isCollectionScope(scope)) {
    yield call(startBatchMistralAnalysisProcess, scope.collectionId, model, workerName);
  } else if (isCanvasScope(scope)) {
    yield call(
      startSingleMistralAnalysisProcess,
      scope.canvasId,
      scope.collectionId,
      model,
      workerName,
    );
  } else {
    console.log('`Mistral plugin saga started for annotation scope', scope.annotationId);
  }
}

export function* exportResult(results: Result[]) {
  if (results.length === 0) {
    console.warn('No results to export from Mistral plugin');
    return;
  }
  let allTheData: unknown[] = [];
  for (let i = 0; i < results.length; i++) {
    try {
      const dataParsed = JSON.parse(results[i].value as string) as unknown[];
      allTheData = [...allTheData, ...dataParsed];
    } catch (error) {
      //TODO: on fait quoi lorsque le json est invalide ?
      console.error('Error parsing dataInCanvas:', error);
    }
  }
  yield call(
    FileSaver.saveAs,
    new Blob([JSON.stringify(allTheData)], { type: 'text/plain;charset=utf-8' }),
    'exported_data.json',
  );

  const csv = json2csv(allTheData as object[]);
  yield call(
    FileSaver.saveAs,
    new Blob([csv], { type: 'text/plain;charset=utf-8' }),
    'exported_data.csv',
  );
}
