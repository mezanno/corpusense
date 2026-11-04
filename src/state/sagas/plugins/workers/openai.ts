import { LLMProfile } from '@/data/models/LLMProfile';
import { Result } from '@/data/models/result/result';
import { Scope } from '@/data/models/scope/scope';
import { isAnnotationScope, isCanvasScope, toString } from '@/data/models/scope/scope.utils';
import { Task, Worker, WorkerEvent, WorkerResponse } from '@/data/models/worker/worker';
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
import i18n from '@/i18n';
import { FunctionResult } from '@/utils/functionResult';
import { getErrorMessage } from '@/utils/utils';
import FileSaver from 'file-saver';
import { json2csv } from 'json-2-csv';
import * as XLSX from 'xlsx';
import { flattenForExcel, sanitizeFilenamePart } from './excel.utils';
import { OpenAICompatibleClient } from './openai/OpenAICompatibleClient';
import { WorkerCategory } from './WorkerCategory';

export const pluginName = 'openai';
export const pluginDisplayName = 'Extraction de données OpenAI API';
export const pluginDescription =
  "Extrait des données structurées à partir du texte. Nécessite que l'OCR soit fait ainsi qu'un modèle de données.";
export const pluginCategory = WorkerCategory.LLM;
export const pluginExportFormats = ['json', 'csv', 'xlsx'];

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
 * LLM entry point (default export)
 * It fetches the text from the scope, sends it,
 * and returns the response.
 */
export default async function run(task: Task, worker: Worker): Promise<WorkerResponse> {
  //TODO add a logger system to display logs in the UI
  console.log(`Processing task for scope ${toString(task.scope)}`);

  if (
    worker.params === undefined ||
    worker.params === null ||
    typeof worker.params !== 'object' ||
    !('profileId' in worker.params)
  ) {
    return { event: WorkerEvent.RESULT_ERR, message: i18n.t('error_no_profileId') };
  }

  const profileId = worker.params.profileId as string;
  if (profileId === undefined) {
    return { event: WorkerEvent.RESULT_ERR, message: i18n.t('error_no_mistral_key') };
  }

  const profiles: LLMProfile[] = (() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem('llm-profiles') ?? '[]');
      return Array.isArray(parsed) ? (parsed as LLMProfile[]) : [];
    } catch {
      return [];
    }
  })();
  const profile = profiles.find((p) => p.id === profileId);
  if (profile === undefined) {
    return { event: WorkerEvent.RESULT_ERR, message: i18n.t('error_no_mistral_key') };
  }

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
  if (text === undefined || text.length === 0) {
    return { event: WorkerEvent.RESULT_ERR, message: i18n.t('error_export_no_text') };
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

  const prompt = model.prompt.replace('{{schema}}', generateSchema(model, lastValue));

  try {
    const client = new OpenAICompatibleClient({
      apiKey: profile.apiKey,
      baseURL: profile.baseUrl,
    });
    const response = await client.complete({
      model: profile.model,
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
      responseFormat: { type: 'json_object' },
    });

    console.log('Response from Worker:', response);
    return {
      event: WorkerEvent.RESULT_OK,
      content: response.content,
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
 * Export function to export results from the OpenAI plugin saga.
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
