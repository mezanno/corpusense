import { Result } from '@/data/models/result/result';
import { Scope } from '@/data/models/scope/scope';
import { isAnnotationScope, isCanvasScope, toString } from '@/data/models/scope/scope.utils';
import { Task, WorkerEvent, WorkerResponse } from '@/data/models/worker/worker';
import {
  getCollectionRepository,
  getModelRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { IndexedDBResultRepository } from '@/data/repositories/indexeddb/results';
import { toGallicaUrl } from '@/data/utils/canvas';
import {
  generateNumberedTextForCollection,
  generateNumberedTextFromCanvas,
} from '@/data/utils/export';
import { generateSchema, hasPreviousValueField } from '@/data/utils/model';
import { getValueForPluginParam } from '@/data/utils/plugins';
import i18n from '@/i18n';
import { PluginParams } from '@/state/reducers/workers';
import { FunctionResult } from '@/utils/functionResult';
import { getErrorMessage } from '@/utils/utils';
import { Mistral } from '@mistralai/mistralai';
import FileSaver from 'file-saver';
import { json2csv } from 'json-2-csv';
import * as XLSX from 'xlsx';
import { WorkerCategory } from './WorkerCategory';
import { flattenForExcel, sanitizeFilenamePart } from './excel.utils';

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
    //TODO : en cas d'erreur ?
    fullText = FunctionResult.unwrapOr(
      await generateNumberedTextForCollection(scope.collectionId),
      '',
    );
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
    const collectionResult = await collectionRepository.getById(task.scope.collectionId);
    if (!collectionResult.ok) {
      return {
        event: WorkerEvent.RESULT_ERR,
        message: collectionResult.error.message,
      };
    }
    const collection = collectionResult.value;
    const modelId = collection.modelId;
    if (modelId === undefined) {
      return {
        event: WorkerEvent.RESULT_ERR,
        message: i18n.t('error_model_undefined'),
      };
    }
    const modelRepository = getModelRepository();
    const modelResult = await modelRepository.getById(modelId);
    if (!modelResult.ok) {
      return {
        event: WorkerEvent.RESULT_ERR,
        message: modelResult.error.message,
      };
    }
    model = modelResult.value;
  } catch (error) {
    return {
      event: WorkerEvent.RESULT_ERR,
      message: getErrorMessage(error),
    };
  }

  const text = await getText(task.scope);
  //return an error if no text is found
  if (text === undefined || text.length === 0) {
    console.log('No text found for this canvas');
    return { event: WorkerEvent.RESULT_ERR, message: i18n.t('error_export_no_text') };
  }

  const apiKey = getValueForPluginParam(pluginName, 'apiKey');
  //return an error if no API key is found
  if (apiKey === null || apiKey === '') {
    console.log('No Mistral API key found');
    return { event: WorkerEvent.RESULT_ERR, message: i18n.t('error_no_mistral_key') };
  }

  const modelHasPreviousValueField = hasPreviousValueField(model);
  let lastValue = undefined;
  if (modelHasPreviousValueField && task.previousTask !== undefined) {
    //fetch the last result for this worker to get the previous value for fields that have getPreviousValue set to true
    const resultRepository = new IndexedDBResultRepository();
    const result = await resultRepository.getResultByWorkerIdAndTaskId(
      task.previousTask.workerId,
      task.previousTask.taskId,
    );
    if (result.ok) {
      const previousResult = JSON.parse(result.value.value as string) as unknown;
      if (Array.isArray(previousResult)) {
        lastValue = previousResult[previousResult.length - 1] as unknown; //on prend la dernière entrée si le résultat est un tableau
      } else {
        lastValue = previousResult;
      }
    }
  }
  console.log('previousResult: ', lastValue);

  const prompt = model.prompt.replace('{{schema}}', generateSchema(model, lastValue));
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
      event: WorkerEvent.RESULT_OK,
      // content: response.choices[0].message.content as string,
      content: response.choices[0]?.message?.content as string,
    };
  } catch (error) {
    return {
      event: WorkerEvent.RESULT_ERR,
      message: getErrorMessage(error),
    };
  }
}

export async function extractData(results: Result[]): Promise<unknown[]> {
  if (results.length === 0) {
    console.warn(`No results to export from ${pluginDisplayName} plugin`);
    return [];
  }

  const collectionRepository = getCollectionRepository();

  const allTheData: unknown[] = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const canvasId = isCanvasScope(result.scope) ? toGallicaUrl(result.scope.canvasId) : undefined;

    const tagsResult = await collectionRepository.getTagsByCollectionId(result.scope.collectionId);

    let tagsAsColumns: Record<string, string> = {};
    if (tagsResult.ok) {
      const tags = tagsResult.value;
      tagsAsColumns = tags.reduce(
        (acc, t, index) => {
          acc[`tag${index + 1}`] = t.label;
          return acc;
        },
        {} as Record<string, string>,
      );
    }

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

  return allTheData;
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

  const collectionRepository = getCollectionRepository();
  const collectionId = results[0].scope.collectionId;
  const collectionResult = await collectionRepository.getById(collectionId);
  const collectionName = collectionResult.ok ? collectionResult.value.name : undefined;
  const collectionNamePart = sanitizeFilenamePart(collectionName ?? collectionId);

  // Utiliser YYYY-MM-DD évite notamment les "/" dans les noms de fichiers
  // avec les locales françaises.
  const datePart = new Date().toISOString().slice(0, 10);
  const filename = `mistral_export_${collectionNamePart}_${datePart}`;

  const allTheData = await extractData(results);

  // -------------------------------------------------------------------------
  // XLSX
  // -------------------------------------------------------------------------

  if (formats.includes('xlsx')) {
    const flattenedData = flattenForExcel(allTheData);
    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mistral Data');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    FileSaver.saveAs(
      new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
      }),
      `${filename}.xlsx`,
    );
  }

  // -------------------------------------------------------------------------
  // JSON
  // -------------------------------------------------------------------------

  if (formats.includes('json')) {
    FileSaver.saveAs(
      new Blob([JSON.stringify(allTheData, null, 2)], {
        type: 'application/json;charset=utf-8',
      }),
      `${filename}.json`,
    );
  }

  // -------------------------------------------------------------------------
  // CSV
  // -------------------------------------------------------------------------

  if (formats.includes('csv')) {
    const csvData = allTheData.filter(
      (item): item is object => item !== null && typeof item === 'object',
    );

    const csv = json2csv(csvData);

    FileSaver.saveAs(
      new Blob([csv], {
        type: 'text/csv;charset=utf-8',
      }),
      `${filename}.csv`,
    );
  }
}
