import { ElementType, getAnnotationType } from '@/data/models/Annotation';
import { convertPeroTranscriptionsToAnnotations } from '@/data/models/converters/peroConverter';
import { peroResultError, peroResultSchema } from '@/data/models/converters/peroSchema';
import { isAnnotationScope, toString } from '@/data/models/Scope';
import { Task, WorkerResponse, WorkerStatus } from '@/data/models/Worker';
import {
  getAnnotationRepository,
  getCollectionRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { getImage } from '@/data/utils/canvas';
import { PluginParams } from '@/state/reducers/workers';
import { getErrorMessage } from '@/utils/utils';
import { Client } from '@gradio/client';

export const pluginName = 'peroocr';
export const pluginDisplayName = 'Pero OCR';
export const pluginDescription = 'Reconnaissance de texte';
export const pluginCategory = 'OCR';

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

    const client = await Client.connect('https://api.mezanno.xyz/ocr/');
    /* We change the image to size to match the maximum size. We do this to avoir lower sizes used in image ids.
     */
    const gradioResult = await client.predict('/transcribe', {
      image_url: setIiifSize(image.id, image.width ?? 0, image.height ?? 0),
      regions,
    });
    console.log(gradioResult.data);
    try {
      const peroResult = peroResultSchema.parse(gradioResult.data);
      const annotations = convertPeroTranscriptionsToAnnotations(
        peroResult,
        task.scope.canvasId,
        task.scope.collectionId,
      );
      const newAnnotations = await annotationRepository.addAll(annotations);
      return {
        status: WorkerStatus.COMPLETED,
        content: newAnnotations,
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

export const setIiifSize = (url: string, width: number, height: number) => {
  return url.replace(/\/full\/[^/]+\/0\//, `/full/${width},${height}/0/`);
};
