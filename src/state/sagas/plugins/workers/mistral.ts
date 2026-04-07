import { Result } from '@/data/models/Result';
import { isAnnotationScope, isCanvasScope, Scope, toString } from '@/data/models/Scope';
import { Tag } from '@/data/models/Tag';
import { Task, WorkerResponse, WorkerStatus } from '@/data/models/Worker';
import {
  getCollectionRepository,
  getModelRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { toGallicaUrl } from '@/data/utils/canvas';
import {
  generateNumberedTextForCollection,
  generateNumberedTextFromCanvas,
} from '@/data/utils/export';
import { generateSchema } from '@/data/utils/model';
import { getValueForPluginParam } from '@/data/utils/plugins';
import i18n from '@/i18n';
import { PluginParams } from '@/state/reducers/workers';
import { getErrorMessage } from '@/utils/utils';
import { Mistral } from '@mistralai/mistralai';
import FileSaver from 'file-saver';
import { json2csv } from 'json-2-csv';
import * as XLSX from 'xlsx';
import { WorkerCategory } from './WorkerCategory';

export const pluginName = 'mistral';
export const pluginDisplayName = 'Extraction de données Mistral';
export const pluginDescription =
  "Extrait des données structurées à partir du texte. Nécessite que l'OCR soit fait ainsi qu'un modèle de données.";
export const pluginCategory = WorkerCategory.LLM;
export const pluginExportFormats = ['json', 'csv', 'xlsx'];
export const pluginConfigurationParams = {
  apiKey: {
    description: 'Clé API Mistral',
  },
  mistralModel: {
    description: 'Modèle Mistral à utiliser (ex: mistral-medium-latest)',
  },
};

//TODO: à déplacer dans un fichier utils
async function getText(scope: Scope) {
  let fullText = '';
  if (isCanvasScope(scope)) {
    const { text } = await generateNumberedTextFromCanvas(scope.canvasId, scope.collectionId);
    fullText = text;
  } else if (isAnnotationScope(scope)) {
    //TODO: implement text extraction from annotation
    fullText = '';
  } else {
    fullText = await generateNumberedTextForCollection(scope.collectionId);
  }
  return fullText.replace(/["«»]/g, '');
}

/*
 * Mistral entry point for the Mistral plugin (default export)
 * It fetches the text from the scope, sends it to the Mistral API,
 * and returns the response.
 */
export default async function run(task: Task, _params: PluginParams): Promise<WorkerResponse> {
  console.log(`Processing task for scope ${toString(task.scope)}`);
  let model = undefined;
  const collectionRepository = getCollectionRepository();
  try {
    const collection = await collectionRepository.getById(task.scope.collectionId);
    const modelId = collection.modelId;
    if (modelId === undefined) {
      return {
        status: WorkerStatus.ERROR,
        statusMessage: i18n.t('error_model_undefined'),
      };
    }
    const modelRepository = getModelRepository();
    model = await modelRepository.getById(modelId);
  } catch (error) {
    return {
      status: WorkerStatus.ERROR,
      statusMessage: getErrorMessage(error),
    };
  }

  const text = await getText(task.scope);
  //return an error if no text is found
  if (text === undefined || text.length === 0) {
    console.log('No text found for this canvas');
    return { status: WorkerStatus.ERROR, statusMessage: i18n.t('error_export_no_text') };
  }

  const apiKey = getValueForPluginParam(pluginName, 'apiKey');
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
          maxInterval: 30000, // intervalle maximal en millisecondes entre tentatives
          exponent: 1.5, // facteur exponentiel
          maxElapsedTime: 120000, // durée max (en millisecondes) totale pour toutes les tentatives
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
export async function exportResult(results: Result[], formats: string[]) {
  if (results.length === 0) {
    console.warn(`No results to export from ${pluginDisplayName} plugin`);
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

  if (formats.includes('xlsx')) {
    const flattenedData: Record<string, unknown>[] = [];
    allTheData.forEach((item) => {
      if (item !== undefined && typeof item === 'object') {
        const flattenedItem: Record<string, unknown> = { ...item };
        Object.keys(flattenedItem).forEach((key) => {
          if (Array.isArray(flattenedItem[key])) {
            flattenedItem[key] = (flattenedItem[key] as unknown[]).join('; ');
          } else if (typeof flattenedItem[key] === 'object' && flattenedItem[key] !== null) {
            flattenedItem[key] = JSON.stringify(flattenedItem[key]);
          }
        });
        flattenedData.push(flattenedItem);
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mistral Data');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    FileSaver.saveAs(
      new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
      }),
      'exported_data.xlsx',
    );
  }

  if (formats.includes('json')) {
    FileSaver.saveAs(
      new Blob([JSON.stringify(allTheData)], { type: 'text/plain;charset=utf-8' }),
      'exported_data.json',
    );
  }

  if (formats.includes('csv')) {
    const csv = json2csv((allTheData as object[]).filter(Boolean));
    FileSaver.saveAs(new Blob([csv], { type: 'text/plain;charset=utf-8' }), 'exported_data.csv');
  }
}
