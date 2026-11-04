import { ElementType } from '@/data/models/annotations/annotation';
import { getAnnotationType } from '@/data/models/annotations/annotation.utils';
import { convertPeroTranscriptionsToAnnotations } from '@/data/models/converters/peroConverter';
import { peroResultError, peroResultSchema } from '@/data/models/converters/peroSchema';
import { Result } from '@/data/models/result/result';
import { isAnnotationScope, isCanvasScope, toString } from '@/data/models/scope/scope.utils';
import { Task, WorkerEvent, WorkerResponse } from '@/data/models/worker/worker';
import {
  getAnnotationRepository,
  getCollectionRepository,
  getSourceRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { getFile, getImage } from '@/data/utils/canvas';
import { applyModifierChainToAnnotations } from '@/data/utils/modifierChain';
import { getValueForPluginParam } from '@/data/utils/plugins';
import i18n from '@/i18n';
import { PluginParams } from '@/state/reducers/workers';
import { getErrorMessage } from '@/utils/utils';
import { Client } from '@gradio/client';
import FileSaver from 'file-saver';
import { WorkerCategory } from './WorkerCategory';
import { deleteFile, uploadFile, UploadFileResult } from './supabase/utils';

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
  if (!isCanvasScope(task.scope) && !isAnnotationScope(task.scope)) {
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
        message: canvasWithSourceIdResult.error.message,
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
    let regions = JSON.stringify([]);
    if (isAnnotationScope(task.scope)) {
      const result = await annotationRepository.getById(task.scope.annotationId);
      if (result.ok) {
        const annotation = result.value;
        regions = JSON.stringify([
          {
            xtl: annotation.target.selector.geometry.bounds.minX,
            ytl: annotation.target.selector.geometry.bounds.minY,
            xbr: annotation.target.selector.geometry.bounds.maxX,
            ybr: annotation.target.selector.geometry.bounds.maxY,
          },
        ]);
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
        event: WorkerEvent.RESULT_ERR,
        message: 'Pero OCR API URL is not configured',
      };
    }

    let localImageResult: UploadFileResult | undefined = undefined;
    //if source is local, we need to upload the image to supabase storage first, and then use the public url for the image in the gradio request
    const sourceRepository = getSourceRepository();
    const sourceContentResult = await sourceRepository.getContentById(canvasWithSourceId.sourceId);
    if (!sourceContentResult.ok) {
      throw sourceContentResult.error;
    }
    const sourceContent = sourceContentResult.value;
    if (sourceContent.type === 'local') {
      const fileHandle = sourceContent.localFile.outputDirectoryHandle;
      const imageToProcess = await getFile(image.id, fileHandle);
      localImageResult = await uploadFile(imageToProcess);
    }

    const imageUrl = sourceContent.type === 'local' ? localImageResult?.publicUrl : image.id;
    if (imageUrl === undefined) {
      return {
        event: WorkerEvent.RESULT_ERR,
        message: 'Image URL is undefined',
      };
    }
    const client = await Client.connect(peroUrl);

    /* We change the image to size to match the maximum size. We do this to avoir lower sizes used in image ids.
     */
    const gradioResult = await client.predict('/transcribe', {
      image_url: setIiifSize(imageUrl, image.width ?? 0, image.height ?? 0),
      regions,
    });
    if (sourceContent.type === 'local' && localImageResult?.path !== undefined) {
      await deleteFile(localImageResult.path); //delete the uploaded image from supabase storage after processing
    }
    try {
      const peroResult = peroResultSchema.parse(gradioResult.data);
      const newAnnotations = convertPeroTranscriptionsToAnnotations(
        peroResult,
        task.scope.canvasId,
        task.scope.collectionId,
      );

      //if a post-processing function is defined for the collection, apply it to the new annotations before saving them
      const collectionResult = await collectionRepository.getById(task.scope.collectionId);
      const postOcrModifierChainId = collectionResult.ok
        ? collectionResult.value.postOcrModifierChainId
        : undefined;
      let savedAnnotations;
      if (postOcrModifierChainId !== undefined && postOcrModifierChainId.trim() !== '') {
        const updatedAnnotations = await applyModifierChainToAnnotations(
          postOcrModifierChainId,
          newAnnotations.map((a) => ({ ...a, order: 0 })), //we have to set the order to transofrm AnnotationDTO into Annotation for the modifier chain function, but it will be reset when saving the annotations
        );
        savedAnnotations = await annotationRepository.addAll(updatedAnnotations);
      } else {
        savedAnnotations = await annotationRepository.addAll(newAnnotations);
      }

      return {
        event: WorkerEvent.RESULT_OK,
        content: savedAnnotations,
      };
    } catch (error) {
      try {
        const peroError = peroResultError.parse(gradioResult.data);
        console.error('peroError: ', peroError[0].result.error);
        return {
          event: WorkerEvent.RESULT_ERR,
          message: peroError[0].result.error,
        };
      } catch (err) {
        console.error('Error parsing peroResult:', err);
        return {
          event: WorkerEvent.RESULT_ERR,
          message: getErrorMessage(err),
        };
      }
    }
  } catch (error) {
    console.log('Error in peroocr worker: ', error);

    return {
      event: WorkerEvent.RESULT_ERR,
      message: getErrorMessage(error),
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
