import { ElementType, getAnnotationType } from '@/data/models/Annotation';
import { convertPeroTranscriptionsToAnnotations } from '@/data/models/converters/peroConverter';
import { peroResultError, peroResultSchema } from '@/data/models/converters/peroSchema';
import { toString } from '@/data/models/Scope';
import { Task, WorkerResponse, WorkerStatus } from '@/data/models/Worker';
import { getAnnotationRepository } from '@/data/repositories/indexeddb/dbFactory';
import { getImage } from '@/data/utils/canvas';
import { addAnnotationsSuccess } from '@/state/reducers/annotations';
import { PluginParams } from '@/state/reducers/workers';
import { getErrorMessage } from '@/utils/utils';
import { Client } from '@gradio/client';
import { put } from 'redux-saga/effects';

export const pluginName = 'peroocr';

/*
 * Type guard to check if params contains a model.
 * This is used to ensure that the params passed to the Mistral plugin saga
 * contains a DataModel object.
 */
function hasRegion(params: PluginParams): params is PluginParams & {
  region: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
} {
  return 'region' in params;
}

export default async function peroSaga(task: Task, params: PluginParams): Promise<WorkerResponse> {
  console.log(`Processing task for scope ${toString(task.scope)}`);
  const annotationRepository = getAnnotationRepository();
  try {
    const image = getImage(task.canvas);
    let regions = JSON.stringify([]);
    if (hasRegion(params)) {
      regions = JSON.stringify([
        {
          xtl: params.region.left,
          ytl: params.region.top,
          xbr: params.region.left + params.region.width,
          ybr: params.region.top + params.region.height,
        },
      ]);
    } else {
      const annotations = await annotationRepository.getAnnotationsByScope({
        canvasId: task.canvas.id,
        collectionId: task.scope.collectionId,
      });
      const annotationRegions = annotations.filter(
        (a) => getAnnotationType(a) === ElementType.REGION,
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
    const gradioResult = await client.predict('/transcribe', { image_url: image.id, regions });
    console.log(gradioResult.data);
    try {
      const peroResult = peroResultSchema.parse(gradioResult.data);
      const annotations = convertPeroTranscriptionsToAnnotations(
        peroResult,
        task.canvas.id,
        task.scope.collectionId,
      );
      const newAnnotations = await annotationRepository.saveAllAnnotations(annotations);
      put(addAnnotationsSuccess(newAnnotations));
      return {
        status: WorkerStatus.COMPLETED,
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
    console.error(getErrorMessage(error));
    return {
      status: WorkerStatus.ERROR,
      statusMessage: getErrorMessage(error),
    };
  }
}
