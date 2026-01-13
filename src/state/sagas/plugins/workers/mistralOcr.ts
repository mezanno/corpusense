// // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// // @ts-nocheck
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
import { getFile, getImage, toGallicaUrl } from '@/data/utils/canvas';
import i18n from '@/i18n';
import { PluginParams } from '@/state/reducers/workers';
import { canvasToBase64, cropImage } from '@/utils/images';
import { getErrorMessage } from '@/utils/utils';
import { Mistral } from '@mistralai/mistralai';
import FileSaver from 'file-saver';
import { json2csv } from 'json-2-csv';
import * as XLSX from 'xlsx';

export const pluginName = 'mistralocr';
export const pluginDisplayName = 'Mistral OCR';
export const pluginDescription = 'Reconnaissance de texte';
export const pluginCategory = 'OCR';
export const pluginExportFormats = ['txt'];

// const BBoxItemSchema = z
//   .object({
//     text: z.string().describe('The text content of the element.'),
//     top_left_x: z.number(),
//     top_left_y: z.number(),
//     bottom_right_x: z.number(),
//     bottom_right_y: z.number(),
//   })
//   .describe('A bounding box representing an element of text.');

// const SizeSchema = z.object({
//   width: z.number().describe('The width of the image in pixels.'),
//   height: z.number().describe('The height of the image in pixels.'),
// });

// export const DocumentSchemaZOD = z.object({
//   bbox: z
//     .array(BBoxItemSchema)
//     .describe(
//       'List of bounding boxes detected in the image. Each bounding box contains an element of text and its coordinates in pixels based on the dimensions of the document sent. 0,0 is the top-left corner of the document.',
//     ),
//   image: SizeSchema.describe('The dimensions of the processed image.'),
//   origin: SizeSchema.describe('The dimensions of the received image.'),
// });
type Region = {
  xtl: number;
  ytl: number;
  xbr: number;
  ybr: number;
};

/*
 * Mistral entry point for the Mistral plugin (default export)
 * It fetches the text from the scope, sends it to the Mistral API,
 * and returns the response.
 */
export default async function run(task: Task, _params: PluginParams): Promise<WorkerResponse> {
  console.log(`Processing task for scope ${toString(task.scope)}`);
  if (!isCanvasScope(task.scope)) {
    return {
      status: WorkerStatus.ERROR,
      statusMessage: i18n.t('error_task_invalid_scope'),
    };
  }
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
    let regions: Region[] = [];
    if (isAnnotationScope(task.scope)) {
      const annotation = await annotationRepository.getById(task.scope.annotationId);
      regions = [
        {
          xtl: annotation.target.selector.geometry.bounds.minX,
          ytl: annotation.target.selector.geometry.bounds.minY,
          xbr: annotation.target.selector.geometry.bounds.maxX,
          ybr: annotation.target.selector.geometry.bounds.maxY,
        },
      ];
    } else {
      const annotations = await annotationRepository.getByScope({
        canvasId: canvas.id,
        collectionId: task.scope.collectionId,
      });
      const annotationRegions = annotations.filter(
        (a) => getAnnotationType(a) === ElementType.TEXT_REGION,
      );
      if (annotationRegions.length > 0) {
        // regions = JSON.stringify(
        regions = annotationRegions
          .sort((a1, a2) => (a1.order ?? 0) - (a2.order ?? 0))
          .map((annotation) => {
            return {
              xtl: annotation.target.selector.geometry.bounds.minX,
              ytl: annotation.target.selector.geometry.bounds.minY,
              xbr: annotation.target.selector.geometry.bounds.maxX,
              ybr: annotation.target.selector.geometry.bounds.maxY,
            };
          });
      } else {
        // If no TEXT_REGION annotations, process the whole image
        regions = [
          {
            xtl: 0,
            ytl: 0,
            xbr: image.width ?? 0,
            ybr: image.height ?? 0,
          },
        ];
      }
    }

    const apiKey = localStorage.getItem('mistralApiKey');
    //return an error if no API key is found
    if (apiKey === null || apiKey === '') {
      console.log('No Mistral API key found');
      return { status: WorkerStatus.ERROR, statusMessage: i18n.t('error_no_mistral_key') };
    }

    let imageToProcess: string | File = image.id;
    if (imageToProcess !== null && imageToProcess.startsWith('http') === false) {
      try {
        imageToProcess = await getFile(image.id);
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

    const annotations: AnnotationDTO[] = [];
    for (const region of regions) {
      const cropSize = {
        x: region.xtl,
        y: region.ytl,
        width: region.xbr - region.xtl,
        height: region.ybr - region.ytl,
      };
      const croppedCanvas = await cropImage(imageToProcess, cropSize);
      const imageUrlBase64 = await canvasToBase64(croppedCanvas, 'image/jpeg', 0.7);
      const response = await client.ocr.process({
        model: 'mistral-ocr-latest',
        document: {
          type: 'image_url',
          imageUrl: imageUrlBase64,
        },
        // documentAnnotationFormat: responseFormatFromZodObject(DocumentSchemaZOD),
      });

      console.log('Response from Mistral:', response);
      if (response.pages !== null && response.pages[0] !== undefined) {
        const markdown = response.pages[0].markdown;
        const lines = markdown.split('|');
        for (const line of lines) {
          annotations.push(
            createAnnotation({
              canvasId: task.scope.canvasId,
              collectionId: task.scope.collectionId,
              minX: 0,
              minY: 0,
              maxX: 0,
              maxY: 0,
              type: ElementType.TEXT_LINE,
              value: line.trim(),
            }),
          );
        }
      }
    }
    const newAnnotations = await annotationRepository.addAll(annotations);
    return {
      status: WorkerStatus.COMPLETED,
      content: newAnnotations,
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
