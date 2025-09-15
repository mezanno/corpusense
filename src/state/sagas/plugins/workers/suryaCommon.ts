import { AnnotationDTO, ElementType, getAnnotationType } from '@/data/models/Annotation';
import {
  convertSuryaLayoutPredictionsToAnnotations,
  convertSuryaOcrPredictionsToAnnotations,
  convertSuryaTablePredictionsToAnnotations,
} from '@/data/models/converters/suryaConverter';
import {
  suryaLayoutResultSchema,
  suryaOcrResultSchema,
  suryaTableResultSchema,
} from '@/data/models/converters/suryaSchema';
import { isAnnotationScope } from '@/data/models/Scope';
import { Task, WorkerResponse, WorkerStatus } from '@/data/models/Worker';
import {
  getAnnotationRepository,
  getCollectionRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { getImage } from '@/data/utils/canvas';
import { getErrorMessage } from '@/utils/utils';

export interface Region {
  xtl: number;
  ytl: number;
  xbr: number;
  ybr: number;
}

async function post(
  endpoint: 'ocr' | 'layout' | 'table',
  url: string,
  regions: Region[],
): Promise<unknown> {
  const suryaUrl = localStorage.getItem('suryaUrl') ?? 'http://localhost:8000';

  const res = await fetch(`${suryaUrl}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: url,
      regions: regions,
    }),
  });
  return await res.json();
}

export async function suryaRun(
  task: Task,
  endpoint: 'ocr' | 'layout' | 'table',
): Promise<WorkerResponse> {
  const annotationRepository = getAnnotationRepository();
  try {
    const collectionRepository = getCollectionRepository();
    const canvas = await collectionRepository.getCanvasByScope(task.scope);
    const image = getImage(canvas);
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
        canvasId: task.scope.canvasId,
        collectionId: task.scope.collectionId,
      });
      const annotationRegions = annotations.filter(
        (a) => getAnnotationType(a) === ElementType.REGION,
      );
      if (annotationRegions.length > 0) {
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
      }
    }
    console.log(`Regions: `, regions);

    if (image?.id === undefined) {
      return {
        status: WorkerStatus.ERROR,
        statusMessage: 'No image found for the canvas.',
      };
    }

    const response = await post(endpoint, image.id, regions);
    console.log(response);

    try {
      let annotations: AnnotationDTO[] = [];
      if (endpoint === 'ocr') {
        const suryaResult = suryaOcrResultSchema.parse(response);
        console.log('suryaResult: ', suryaResult);
        annotations = convertSuryaOcrPredictionsToAnnotations(
          suryaResult,
          canvas.id,
          task.scope.collectionId,
        );
      } else if (endpoint === 'layout') {
        const suryaResult = suryaLayoutResultSchema.parse(response);
        console.log('suryaResult: ', suryaResult);
        annotations = convertSuryaLayoutPredictionsToAnnotations(
          suryaResult,
          canvas.id,
          task.scope.collectionId,
        );
      } else if (endpoint === 'table') {
        const suryaResult = suryaTableResultSchema.parse(response);
        console.log('suryaResult: ', suryaResult);
        annotations = convertSuryaTablePredictionsToAnnotations(
          suryaResult,
          canvas.id,
          task.scope.collectionId,
        );
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
  } catch (error) {
    console.error(getErrorMessage(error));
    return {
      status: WorkerStatus.ERROR,
      statusMessage: getErrorMessage(error),
    };
  }
}
