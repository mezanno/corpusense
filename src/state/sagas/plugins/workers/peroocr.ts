import { ElementType, getAnnotationType } from '@/data/models/Annotation';
import { convertPeroTranscriptionsToAnnotations } from '@/data/models/converters/peroConverter';
import { peroResultError, peroResultSchema } from '@/data/models/converters/peroSchema';
import { Result } from '@/data/models/Result';
import { isAnnotationScope, isCanvasScope, toString } from '@/data/models/Scope';
import { Task, WorkerResponse, WorkerStatus } from '@/data/models/Worker';
import {
  getAnnotationRepository,
  getCollectionRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { getImage } from '@/data/utils/canvas';
import { applyModifierChainToAnnotations } from '@/data/utils/modifierChain';
import { getValueForPluginParam } from '@/data/utils/plugins';
import i18n from '@/i18n';
import { PluginParams } from '@/state/reducers/workers';
import { getErrorMessage } from '@/utils/utils';
import { Client } from '@gradio/client';
import FileSaver from 'file-saver';
import { WorkerCategory } from './WorkerCategory';

export const pluginName = 'peroocr'; //name of the plugin, used to register the plugin inside Corpusense
export const pluginDisplayName = 'Pero OCR'; //display name of the plugin, used in the UI
export const pluginDescription = 'Reconnaissance de texte'; //description of the plugin, used in the UI
export const pluginCategory = WorkerCategory.OCR;
export const pluginExportFormats = ['txt']; //available export formats for this plugin (must match the formats handled in exportResult function)
/*
  Configuration parameters for this plugin
  Each parameter must have a description and can have a default value
*/
export const pluginConfigurationParams = {
  apiUrl: { description: "URL de l'API Pero OCR", defaultValue: 'https://api.mezanno.xyz/ocr/' },
};

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

    const peroUrl = getValueForPluginParam(pluginName, 'apiUrl');
    if (peroUrl === null) {
      return {
        status: WorkerStatus.ERROR,
        statusMessage: 'Pero OCR API URL is not configured',
      };
    }

    const client = await Client.connect(peroUrl);
    /* We change the image to size to match the maximum size. We do this to avoir lower sizes used in image ids.
     */
    const gradioResult = await client.predict('/transcribe', {
      image_url: setIiifSize(image.id, image.width ?? 0, image.height ?? 0),
      regions,
    });
    console.log(gradioResult.data);
    try {
      const peroResult = peroResultSchema.parse(gradioResult.data);
      const newAnnotations = convertPeroTranscriptionsToAnnotations(
        peroResult,
        task.scope.canvasId,
        task.scope.collectionId,
      );

      //if a post-processing function is defined for the collection, apply it to the new annotations before saving them
      const collection = await collectionRepository.getById(task.scope.collectionId);
      let savedAnnotations;
      if (
        collection.postOcrModifierChainId !== undefined &&
        collection.postOcrModifierChainId.trim() !== ''
      ) {
        const updatedAnnotations = await applyModifierChainToAnnotations(
          collection.postOcrModifierChainId,
          newAnnotations.map((a) => ({ ...a, order: 0 })), //we have to set the order to transofrm AnnotationDTO into Annotation for the modifier chain function, but it will be reset when saving the annotations
        );
        savedAnnotations = await annotationRepository.addAll(updatedAnnotations);
      } else {
        savedAnnotations = await annotationRepository.addAll(newAnnotations);
      }

      return {
        status: WorkerStatus.COMPLETED,
        content: savedAnnotations,
      };
    } catch (error) {
      try {
        const peroError = peroResultError.parse(gradioResult.data);
        console.error('peroError: ', peroError[0].result.error);
        return {
          status: WorkerStatus.ERROR,
          statusMessage: peroError[0].result.error,
        };
      } catch (err) {
        console.error('Error parsing peroResult:', err);
        return {
          status: WorkerStatus.ERROR,
          statusMessage: getErrorMessage(err),
        };
      }
    }
  } catch (error) {
    console.log('Error in peroocr worker: ', error);

    return {
      status: WorkerStatus.ERROR,
      statusMessage: getErrorMessage(error),
    };
  }
}

export function exportResult(results: Result[], formats: string[]) {
  if (results.length === 0) {
    console.warn(`No results to export from ${pluginDisplayName} plugin`);
    return;
  }

  if (formats.includes('txt')) {
    const text = results.map((r) => r.value).join('\n\n');
    FileSaver.saveAs(new Blob([text], { type: 'text/plain;charset=utf-8' }), 'exported_text.txt');
  }
}

export const setIiifSize = (url: string, width: number, height: number) => {
  return url.replace(/\/full\/[^/]+\/0\//, `/full/${width},${height}/0/`);
};
