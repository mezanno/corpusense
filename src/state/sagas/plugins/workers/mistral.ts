import { DataModel } from '@/data/models/DataModel';
import { Result } from '@/data/models/Result';
import { isAnnotationScope, isCanvasScope, Scope, toString } from '@/data/models/Scope';
import { Tag } from '@/data/models/Tag';
import { Task, WorkerResponse, WorkerStatus } from '@/data/models/Worker';
import { getCollectionRepository } from '@/data/repositories/indexeddb/dbFactory';
import { toGallicaUrl } from '@/data/utils/canvas';
import { generateNumberedTextFromCanvas } from '@/data/utils/export';
import { generateSchema } from '@/data/utils/model';
import i18n from '@/i18n';
import { PluginParams } from '@/state/reducers/workers';
import { getErrorMessage } from '@/utils/utils';
import { Mistral } from '@mistralai/mistralai';
import FileSaver from 'file-saver';
import { json2csv } from 'json-2-csv';

export const pluginName = 'mistral';

//TODO: à déplacer dans un fichier utils
async function getText(scope: Scope) {
  let text = '';
  if (isCanvasScope(scope)) {
    text = await generateNumberedTextFromCanvas(scope.canvasId, scope.collectionId);
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
export default async function mistralSaga(
  task: Task,
  params: PluginParams,
): Promise<WorkerResponse> {
  console.log(`Processing task for scope ${toString(task.scope)}`);

  //TODO! à déplacer dans saga workers
  if (!hasModel(params)) {
    console.log('Invalid parameters for Mistral plugin saga:', params);
    throw new Error('Invalid parameters for Mistral plugin saga');
  }
  const { model } = params;

  const text = await getText(task.scope);
  //return an error if no text is found
  if (text === undefined || text.length === 0) {
    console.log('No text found for this canvas');
    return { status: WorkerStatus.ERROR, statusMessage: i18n.t('error_export_no_text') };
  }

  const apiKey = localStorage.getItem('mistralApiKey');
  //return an error if no API key is found
  if (apiKey === null || apiKey === '') {
    console.log('No Mistral API key found');
    return { status: WorkerStatus.ERROR, statusMessage: i18n.t('error_no_mistral_key') };
  }

  const prompt = model.prompt.replace('{{schema}}', generateSchema(model));
  const mistralModel = localStorage.getItem('mistralModel') ?? 'mistral-medium-latest';
  console.log('prompt: ', prompt);

  try {
    const client = new Mistral({
      apiKey,
      retryConfig: {
        strategy: 'backoff',
        backoff: {
          initialInterval: 500, // intervalle initial en millisecondes
          maxInterval: 10000, // intervalle maximal en millisecondes entre tentatives
          exponent: 1.5, // facteur exponentiel
          maxElapsedTime: 60000, // durée max (en millisecondes) totale pour toutes les tentatives
        },
        retryConnectionErrors: true, // réessayer en cas d'erreurs de connexion
      },
    });
    const response = await client.chat.complete({
      model: mistralModel,
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0,
      maxTokens: text.length * 2,
      responseFormat: { type: 'json_object' },
    });

    console.log('Response from Mistral:', response);
    return {
      status: WorkerStatus.COMPLETED,
      content: response.choices[0].message.content as string,
    };
  } catch (error) {
    return {
      status: WorkerStatus.ERROR,
      statusMessage: getErrorMessage(error),
    };
  }
}

/*
 * Export function to export results from the Mistral plugin saga.
 * It takes an array of Result objects, extracts the data, and saves it as JSON and CSV files.
 */
export async function exportResult(results: Result[]) {
  if (results.length === 0) {
    console.warn('No results to export from Mistral plugin');
    return;
  }
  const allTheData: unknown[] = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const canvasId = isCanvasScope(result.scope) ? toGallicaUrl(result.scope.canvasId) : undefined;

    const collectionRepository = getCollectionRepository();
    const tags: Tag[] = await collectionRepository.getTagsByCollectionId(result.scope.collectionId);
    const tagsAsColumns = tags.reduce(
      (acc, t, index) => {
        acc[`tag${index + 1}`] = t.label;
        return acc;
      },
      {} as Record<string, string>,
    );

    try {
      const dataParsed = JSON.parse(result.value as string) as unknown;
      const dataParsedArray = (Array.isArray(dataParsed) ? dataParsed : [dataParsed]) as unknown[];
      const dataWithCanvasId = dataParsedArray.map((item) => {
        if (item !== undefined && typeof item === 'object') {
          return {
            ...(item as object),
            canvasId,
            ...tagsAsColumns,
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

  FileSaver.saveAs(
    new Blob([JSON.stringify(allTheData)], { type: 'text/plain;charset=utf-8' }),
    'exported_data.json',
  );

  const csv = json2csv((allTheData as object[]).filter(Boolean));
  FileSaver.saveAs(new Blob([csv], { type: 'text/plain;charset=utf-8' }), 'exported_data.csv');
}
