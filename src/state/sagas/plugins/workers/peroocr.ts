import { Annotation, ElementType, getAnnotationType } from '@/data/models/Annotation';
import { convertPeroTranscriptionsToAnnotations } from '@/data/models/converters/peroConverter';
import { peroResultError, peroResultSchema } from '@/data/models/converters/peroSchema';
import { isCanvasScope, toString } from '@/data/models/Scope';
import { Task, WorkerResponse, WorkerStatus } from '@/data/models/Worker';
import {
  getAnnotationRepository,
  getCanvasRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { getImage } from '@/data/utils/canvas';
import { fetchAnnotationsSuccess } from '@/state/reducers/annotations';
import { PluginParams } from '@/state/reducers/workers';
import { getErrorMessage } from '@/utils/utils';
import { Client } from '@gradio/client';
import { Canvas } from '@iiif/presentation-3';
import { PredictReturn } from 'node_modules/@gradio/client/dist/types';
import { call, Effect, put } from 'redux-saga/effects';

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

export default function* peroSaga(
  task: Task,
  params: PluginParams,
): Generator<Effect, WorkerResponse, Canvas | Annotation[] | Client | PredictReturn> {
  console.log(`Processing task for scope ${toString(task.scope)}`);

  const annotationRepository = getAnnotationRepository();

  if (isCanvasScope(task.scope)) {
    const canvasRepository = getCanvasRepository();
    try {
      const canvas = (yield call(
        [canvasRepository, canvasRepository.getCanvasById],
        task.scope.canvasId,
      )) as Canvas;
      const image = getImage(canvas);
      let regions = JSON.stringify([]);
      if (hasRegion(params)) {
        regions = JSON.stringify(params.region);
      } else {
        const annotations = (yield call(
          [annotationRepository, annotationRepository.getAnnotationsForCanvas],
          canvas.id,
          task.scope.collectionId,
        )) as Annotation[];
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

      const client = (yield call(() => Client.connect('https://api.mezanno.xyz/ocr/'))) as Client;
      const gradioResult = (yield call(() =>
        client.predict('/transcribe', { image_url: image.id, regions }),
      )) as PredictReturn;

      console.log(gradioResult.data);
      try {
        const peroResult = peroResultSchema.parse(gradioResult.data);
        const annotations = convertPeroTranscriptionsToAnnotations(
          peroResult,
          canvas.id,
          task.scope.collectionId,
        );
        yield put(fetchAnnotationsSuccess(annotations));
        yield call([annotationRepository, annotationRepository.saveAllAnnotations], annotations);
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

  return {
    status: WorkerStatus.COMPLETED,
  };
}
