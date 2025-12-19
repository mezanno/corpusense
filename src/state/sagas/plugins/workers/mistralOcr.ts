// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  AnnotationDTO,
  createAnnotation,
  ElementType,
  getAnnotationType,
} from '@/data/models/Annotation';
import { Result } from '@/data/models/Result';
import { isAnnotationScope, isCanvasScope, toString } from '@/data/models/Scope';
import { Tag } from '@/data/models/Tag';
import { Task, WorkerResponse, WorkerStatus } from '@/data/models/Worker';
import {
  getAnnotationRepository,
  getCollectionRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { getImage, toGallicaUrl } from '@/data/utils/canvas';
import { getFile, imageToBase64 } from '@/hooks/useFs';
import i18n from '@/i18n';
import { PluginParams } from '@/state/reducers/workers';
import { getErrorMessage } from '@/utils/utils';
import { Mistral } from '@mistralai/mistralai';
import { responseFormatFromZodObject } from '@mistralai/mistralai/extra/structChat';
import FileSaver from 'file-saver';
import { json2csv } from 'json-2-csv';
import * as XLSX from 'xlsx';
import z from 'zod/v3';

export const pluginName = 'mistralocr';
export const pluginDisplayName = 'Mistral OCR';
export const pluginDescription = 'Reconnaissance de texte';
export const pluginCategory = 'OCR';
export const pluginExportFormats = ['txt'];

const DocumentSchemaZOD = z.object({
  bbox: z
    .array(
      z.object({
        text: z.string().describe('The text content of the line.'),
        x: z
          .number()
          .describe('The x-coordinate in pixels of the top-left corner of the line bounding box.'),
        y: z
          .number()
          .describe('The y-coordinate in pixels of the top-left corner of the line bounding box.'),
        width: z.number().describe('The width in pixels of the line bounding box.'),
        height: z.number().describe('The height in pixels of the line bounding box.'),
      }),
    )
    .describe(
      'List of bounding boxes detected in the image. Each bounding box contains the text of a line and its coordinates in pixels based on the dimensions of the document sended. 0,0 is the top-left corner of the document.',
    ),
});

/*
 * Mistral entry point for the Mistral plugin (default export)
 * It fetches the text from the scope, sends it to the Mistral API,
 * and returns the response.
 */
export default async function run(task: Task, _params: PluginParams): Promise<WorkerResponse> {
  console.log(`Processing task for scope ${toString(task.scope)}`);
  const annotationRepository = getAnnotationRepository();
  try {
    const collectionRepository = getCollectionRepository();
    const canvas = await collectionRepository.getCanvasByScope(task.scope);
    const image = getImage(canvas);
    if (image.id === undefined) {
      return {
        status: WorkerStatus.ERROR,
        statusMessage: 'Image ID is undefined',
      };
    }
    let regions = JSON.stringify([]);
    if (isAnnotationScope(task.scope)) {
      const annotation = await annotationRepository.getById(task.scope.annotationId);
      regions = JSON.stringify([
        {
          xtl: annotation.target.selector.geometry.bounds.minX,
          ytl: annotation.target.selector.geometry.bounds.minY,
          xbr: annotation.target.selector.geometry.bounds.maxX,
          ybr: annotation.target.selector.geometry.bounds.maxY,
        },
      ]);
    } else {
      const annotations = await annotationRepository.getByScope({
        canvasId: canvas.id,
        collectionId: task.scope.collectionId,
      });
      const annotationRegions = annotations.filter(
        (a) => getAnnotationType(a) === ElementType.TEXT_REGION,
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
    }

    const apiKey = localStorage.getItem('mistralApiKey');
    //return an error if no API key is found
    if (apiKey === null || apiKey === '') {
      console.log('No Mistral API key found');
      return { status: WorkerStatus.ERROR, statusMessage: i18n.t('error_no_mistral_key') };
    }

    let imageUrl = image.id;

    if (imageUrl !== null && imageUrl.startsWith('http') === false) {
      try {
        const file = await getFile(image.id);
        imageUrl = await imageToBase64(file);
      } catch (err) {
        console.error('Failed to get file for thumbnail:', err);
      }
    }

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
    const response = await client.ocr.process({
      model: 'mistral-ocr-latest',
      document: {
        type: 'image_url',
        imageUrl,
      },
      documentAnnotationFormat: responseFormatFromZodObject(DocumentSchemaZOD),
    });

    console.log('Response from Mistral:', response);
    if (response.documentAnnotation !== null && response.documentAnnotation !== undefined) {
      const json = JSON.parse(response.documentAnnotation) as unknown;
      console.log('Parsed OCR result:', json);
      const ocrResult = DocumentSchemaZOD.parse(json);
      const annotations: AnnotationDTO[] = [];
      for (const bbox of ocrResult.bbox) {
        annotations.push(
          createAnnotation({
            canvasId: task.scope.canvasId,
            collectionId: task.scope.collectionId,
            minX: bbox.x,
            minY: bbox.y,
            maxX: bbox.x + bbox.width,
            maxY: bbox.y + bbox.height,
            type: ElementType.TEXT_LINE,
            value: bbox.text,
          }),
        );
      }
      const newAnnotations = await annotationRepository.addAll(annotations);
      return {
        status: WorkerStatus.COMPLETED,
        content: newAnnotations,
      };
    } else {
      throw new Error('No document annotation in Mistral response');
    }
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
