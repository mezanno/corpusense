import { Annotation, ElementType, getAnnotationType } from '@/data/models/Annotation';
import { convertSuryaPredictionsToAnnotations } from '@/data/models/converters/suryaConverter';
import { suryaResultSchema } from '@/data/models/converters/suryaSchema';
import { isCanvasScope, toString } from '@/data/models/Scope';
import { Task, WorkerResponse, WorkerStatus } from '@/data/models/Worker';
import {
  getAnnotationRepository,
  getCollectionRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { getImage } from '@/data/utils/canvas';
import { fetchAnnotationsSuccess } from '@/state/reducers/annotations';
import { PluginParams } from '@/state/reducers/workers';
import { getErrorMessage } from '@/utils/utils';
import { Canvas } from '@iiif/presentation-3';
import { call, Effect, put } from 'redux-saga/effects';

export const pluginName = 'surya';

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
): Generator<Effect, WorkerResponse, Canvas | Annotation[] | Blob> {
  console.log(`Processing task for scope ${toString(task.scope)}`);

  const annotationRepository = getAnnotationRepository();

  if (isCanvasScope(task.scope)) {
    const collectionRepository = getCollectionRepository();
    try {
      const canvas = (yield call(
        [collectionRepository, collectionRepository.getCanvasInCollectionById],
        task.scope.canvasId,
        task.scope.collectionId,
      )) as Canvas;
      const image = getImage(canvas);
      let regions = JSON.stringify([]);
      if (hasRegion(params)) {
        regions = JSON.stringify(params.region);
      } else {
        const annotations = (yield call(
          [annotationRepository, annotationRepository.getAnnotationsByScope],
          { canvasId: task.canvas.id, collectionId: task.scope.collectionId },
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
      console.log(`Regions: ${regions}`);

      if (image?.id === undefined) {
        return {
          status: WorkerStatus.ERROR,
          statusMessage: 'No image found for the canvas.',
        };
      }

      const response = yield call(postOCR, image.id);
      console.log(response);

      try {
        const suryaResult = suryaResultSchema.parse(response);
        console.log('suryaResult: ', suryaResult);
        const annotations = convertSuryaPredictionsToAnnotations(
          suryaResult,
          canvas.id,
          task.scope.collectionId,
        );
        yield put(
          fetchAnnotationsSuccess({
            scope: { collectionId: task.scope.collectionId, canvasId: canvas.id },
            annotations,
          }),
        );
        yield call([annotationRepository, annotationRepository.saveAllAnnotations], annotations);
        return {
          status: WorkerStatus.COMPLETED,
        };
      } catch (error) {
        //   try {
        //     const peroError = peroResultError.parse(gradioResult.data);
        //     console.error('peroError: ', peroError[0].result.error);
        //     return {
        //       status: WorkerStatus.ERROR,
        //       statusMessage: peroError[0].result.error,
        //     };
        //   } catch (err) {
        //     console.error('Error parsing peroResult:', err);
        //     return {
        //       status: WorkerStatus.ERROR,
        //       statusMessage: getErrorMessage(err),
        //     };
        //   }
        return {
          status: WorkerStatus.ERROR,
          statusMessage: getErrorMessage(error),
        };
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

async function postOCR(url: string): Promise<unknown> {
  const suryaUrl = localStorage.getItem('suryaUrl') ?? 'http://localhost:8000';

  const res = await fetch(`${suryaUrl}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: url,
    }),
  });
  return await res.json();
}
