import { Collection } from '@/data/models/Collection';
import { DataModel } from '@/data/models/DataModel';
import { Result } from '@/data/models/Result';
import { isAnnotationScope, isCanvasScope, Scope, toString } from '@/data/models/Scope';
import { Task, WorkerResponse, WorkerStatus } from '@/data/models/Worker';
import { toGallicaUrl } from '@/data/utils/canvas';
import { generateTextFromCanvas } from '@/data/utils/export';
import { generateSchema } from '@/data/utils/model';
import i18n from '@/i18n';
import { PluginParams } from '@/state/reducers/workers';
import { getErrorMessage } from '@/utils/utils';
import FileSaver from 'file-saver';
import { json2csv } from 'json-2-csv';
import { call, Effect } from 'redux-saga/effects';

export const pluginName = 'mistral';

function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

//TODO: à déplacer dans un fichier utils
async function getText(scope: Scope) {
  let text = '';
  if (isCanvasScope(scope)) {
    text = await generateTextFromCanvas(scope.canvasId, scope.collectionId);
  } else if (isAnnotationScope(scope)) {
    //TODO: implement text extraction from annotation
    text = '';
  } else {
    throw new Error(`Unsupported scope type for text: ${toString(scope)}`);
  }
  return text.replace(/["«»]/g, '');
}

/*
 * Type guard to check if params contains a model.
 * This is used to ensure that the params passed to the Mistral plugin saga
 * contains a DataModel object.
 */
function hasModel(params: PluginParams): params is PluginParams & { model: DataModel } {
  return 'model' in params;
}

/*
 * Mistral entry point for the Mistral plugin saga (default export)
 * It fetches the text from the scope, sends it to the Mistral API,
 * and returns the response.
 */
export default function* mistralSaga(
  task: Task,
  params: PluginParams,
): Generator<Effect, WorkerResponse, string | Response> {
  console.log(`Processing task for scope ${toString(task.scope)}`);

  //TODO! à déplacer dans saga workers
  if (!hasModel(params)) {
    console.log('Invalid parameters for Mistral plugin saga:', params);
    throw new Error('Invalid parameters for Mistral plugin saga');
  }
  const { model } = params;

  const text = (yield call(getText, task.scope)) as string;
  //return an error if no text is found
  if (text === undefined || text.length === 0) {
    console.log('No text found for this canvas');
    return { status: WorkerStatus.ERROR, statusMessage: i18n.t('error_export_no_text') };
  }

  const textNumbered = text
    .split('\n')
    .map((ligne, index) => `${index + 1}. ${ligne}`)
    .join('\n');

  const apiKey = localStorage.getItem('mistralApiKey');
  //return an error if no API key is found
  if (apiKey === null || apiKey === '') {
    console.log('No Mistral API key found');
    return { status: WorkerStatus.ERROR, statusMessage: i18n.t('error_no_mistral_key') };
  }

  const prompt = model.prompt.replace('{{schema}}', generateSchema(model));
  const mistralModel = localStorage.getItem('mistralModel') ?? 'mistral-medium-latest';
  console.log('prompt: ', prompt);
  const body = {
    model: mistralModel,
    messages: [
      {
        role: 'system',
        content: prompt,
      },
      {
        role: 'user',
        content: textNumbered,
      },
    ],
    temperature: 0,
    max_tokens: textNumbered.length * 2,
    response_format: { type: 'json_object' },
  };

  try {
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

    //TODO! si data.object === 'error' alors on retourne une erreur
    if (typeof data === 'object') {
      if (
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
          if (isValidJson(message.content)) {
            return { status: WorkerStatus.COMPLETED, content: message.content };
          }
        }
      } else if (
        'object' in data &&
        data.object === 'error' &&
        'code' in data &&
        typeof data.code === 'string' &&
        'message' in data &&
        typeof data.message === 'string'
      ) {
        // Handle the case where data is an error object
        console.error('Error from Mistral API:', data);
        return {
          status: WorkerStatus.ERROR,
          statusMessage: `Mistral API error: ${data.code} - ${data.message}`,
        };
      }
    }
  } catch (error) {
    return {
      status: WorkerStatus.ERROR,
      statusMessage: getErrorMessage(error),
    };
  }

  return { status: WorkerStatus.ERROR, statusMessage: 'Invalid response format from Mistral API' };
}

/*
 * Export function to export results from the Mistral plugin saga.
 * It takes an array of Result objects, extracts the data, and saves it as JSON and CSV files.
 */
export function* exportResult(results: Result[]): Generator<Effect, void, Collection> {
  if (results.length === 0) {
    console.warn('No results to export from Mistral plugin');
    return;
  }
  const allTheData: unknown[] = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const canvasId = isCanvasScope(result.scope) ? toGallicaUrl(result.scope.canvasId) : undefined;
    try {
      const dataParsed = JSON.parse(result.value as string) as unknown;
      const dataParsedArray = (Array.isArray(dataParsed) ? dataParsed : [dataParsed]) as unknown[];
      const dataWithCanvasId = dataParsedArray.map((item) => {
        if (item !== undefined && typeof item === 'object') {
          return {
            ...(item as object),
            canvasId,
          };
        }
        return item;
      });

      allTheData.push(...dataWithCanvasId);
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
