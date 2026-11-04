import { ElementType } from '@/data/models/annotations/annotation';
import { AnnotationDTO } from '@/data/models/annotations/annotation.dto';
import { createAnnotation } from '@/data/models/annotations/annotation.factory';
import { getAnnotationType } from '@/data/models/annotations/annotation.utils';
import { Result } from '@/data/models/result/result';
import { isAnnotationScope, isCanvasScope, toString } from '@/data/models/scope/scope.utils';
import { Task, WorkerEvent, WorkerResponse } from '@/data/models/worker/worker';
import {
  getAnnotationRepository,
  getCollectionRepository,
  getSourceRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { getFile, getImage, toGallicaUrl } from '@/data/utils/canvas';
import { getValueForPluginParam } from '@/data/utils/plugins';
import i18n from '@/i18n';
import { PluginParams } from '@/state/reducers/workers';
import { canvasToBase64, cropImage } from '@/utils/images';
import { getErrorMessage } from '@/utils/utils';
import FileSaver from 'file-saver';
import { json2csv } from 'json-2-csv';
import * as XLSX from 'xlsx';
import z from 'zod';
import { PluginApiError, PluginResponseValidationError } from '../errors';
import { WorkerCategory } from './WorkerCategory';

export const pluginName = 'mistralocr';
export const pluginDisplayName = 'Mistral OCR';
export const pluginDescription = 'Reconnaissance de texte';
export const pluginCategory = WorkerCategory.OCR;
export const pluginExportFormats = ['txt'];
export const pluginConfigurationParams = {
  apiKey: {
    description: 'Clé API Mistral',
  },
};

const BlockElementSchema = z.object({
  content: z.string(),
  type: z.string(),
  top_left_x: z.number(),
  top_left_y: z.number(),
  bottom_right_x: z.number(),
  bottom_right_y: z.number(),
});

export const MistralResponseSchema = z.object({
  pages: z.array(
    z.object({
      markdown: z.string(),
      blocks: z.array(BlockElementSchema),
    }),
  ),
});

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
      event: WorkerEvent.RESULT_ERR,
      message: i18n.t('error_task_invalid_scope'),
    };
  }
  const annotationRepository = getAnnotationRepository();
  try {
    const collectionRepository = getCollectionRepository();
    const canvasWithSourceIdResult = await collectionRepository.getCanvasByScope(task.scope);
    if (!canvasWithSourceIdResult.ok) {
      return {
        event: WorkerEvent.RESULT_ERR,
        message: i18n.t('error_canvas_not_found'),
      };
    }
    const canvasWithSourceId = canvasWithSourceIdResult.value;
    const image = getImage(canvasWithSourceId.canvas);
    if (image.id === undefined) {
      return {
        event: WorkerEvent.RESULT_ERR,
        message: 'Image ID is undefined',
      };
    }
    let regions: Region[] = [];
    if (isAnnotationScope(task.scope)) {
      const result = await annotationRepository.getById(task.scope.annotationId);
      if (result.ok) {
        const annotation = result.value;
        regions = [
          {
            xtl: annotation.target.selector.geometry.bounds.minX,
            ytl: annotation.target.selector.geometry.bounds.minY,
            xbr: annotation.target.selector.geometry.bounds.maxX,
            ybr: annotation.target.selector.geometry.bounds.maxY,
          },
        ];
      }
    } else {
      const annotations = await annotationRepository.getByScope({
        canvasId: canvasWithSourceId.canvas.id,
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

    const apiKey = getValueForPluginParam(pluginName, 'apiKey');
    //return an error if no API key is found
    if (apiKey === null || apiKey === '') {
      console.log('No Mistral API key found');
      return { event: WorkerEvent.RESULT_ERR, message: i18n.t('error_no_mistral_key') };
    }

    const sourceRepository = getSourceRepository();
    const sourceContentResult = await sourceRepository.getContentById(canvasWithSourceId.sourceId);

    //TODO: peut mieux faire
    let imageToProcess: string | File = image.id;
    if (sourceContentResult.ok && sourceContentResult.value.type === 'local') {
      try {
        imageToProcess = await getFile(
          image.id,
          sourceContentResult.value.localFile.outputDirectoryHandle,
        );
      } catch (err) {
        console.error('Failed to get file for thumbnail:', err);
      }
    }

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

      //Here, mistral client is not used because it is not working properly with the OCR endpoint (probably not updated). So we use fetch instead.
      const response = await fetch('https://api.mistral.ai/v1/ocr', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral-ocr-latest',
          document: {
            type: 'image_url',
            image_url: imageUrlBase64,
          },
          include_blocks: true,
        }),
      });

      if (!response.ok) {
        throw new PluginApiError({
          plugin: pluginName,
          status: response.status,
          statusText: response.statusText,
          body: await response.text(),
        });
      }

      const result = z.safeParse(MistralResponseSchema, await response.json());
      if (!result.success) {
        // console.log(z.treeifyError(result.error));

        throw new PluginResponseValidationError({
          plugin: pluginName,
          details: JSON.stringify(z.treeifyError(result.error)),
        });
      }
      const responseData = result.data;
      console.log('Response from Mistral:', responseData);
      if (responseData.pages.length > 0) {
        const blocks = responseData.pages[0].blocks;
        for (const block of blocks) {
          annotations.push(
            createAnnotation({
              canvasId: task.scope.canvasId,
              collectionId: task.scope.collectionId,
              minX: block.top_left_x,
              minY: block.top_left_y,
              maxX: block.bottom_right_x,
              maxY: block.bottom_right_y,
              type: ElementType.TEXT_LINE,
              value: block.content,
            }),
          );
        }
      }
    }
    const newAnnotations = await annotationRepository.addAll(annotations);
    return {
      event: WorkerEvent.RESULT_OK,
      content: newAnnotations,
    };
  } catch (error) {
    return {
      event: WorkerEvent.RESULT_ERR,
      message: getErrorMessage(error),
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
