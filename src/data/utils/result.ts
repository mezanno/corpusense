import { AnnotationPage } from '@iiif/presentation-3';
import z from 'zod';
import { Annotation, ElementType } from '../models/annotations/annotation';
import { changeValue, createAnnotation } from '../models/annotations/annotation.factory';
import { convertW3CAnnotationsToIIIF } from '../models/converters/iiif';
import { Result } from '../models/result/result';
import { isCanvasScope } from '../models/scope/scope.utils';
import {
  getAnnotationRepository,
  getCollectionRepository,
} from '../repositories/indexeddb/dbFactory';
import { mergeMultipleAnnotations } from './annotations';
import { ResultConversionError } from './errors';

export const convertResultToIIIFAnnotation = async (result: Result): Promise<AnnotationPage> => {
  //AnnotationPage
  if (!isCanvasScope(result.scope)) {
    throw new ResultConversionError({
      resultId: result.id,
      reason: 'Result scope is not a canvas scope',
    });
  }
  const { canvasId, collectionId } = result.scope;
  const collectionResult = await getCollectionRepository().getById(collectionId);
  if (!collectionResult.ok) {
    throw collectionResult.error;
  }
  const collection = collectionResult.value;
  const modelId = collection.modelId;
  if (modelId === undefined) {
    throw new ResultConversionError({
      resultId: result.id,
      reason: `No model found for collection ${collection.name}`,
    });
  }

  const lineAnnotations = await getAnnotationRepository().getByScopeAndTypes(result.scope, [
    ElementType.TEXT_LINE,
  ]);
  if (lineAnnotations.length === 0) {
    throw new ResultConversionError({
      resultId: result.id,
      reason: `No line annotations found for canvas ${canvasId} in collection ${collectionId}`,
    });
  }

  const dataSchema = z.array(
    z
      .object({
        position: z.array(z.number()),
      })
      .loose(),
  );

  const dataValidation = dataSchema.safeParse(
    typeof result.value === 'string' ? JSON.parse(result.value) : result.value,
  );
  if (!dataValidation.success) {
    throw new ResultConversionError({
      resultId: result.id,
      reason: `Result value is not a valid array of objects with position property: ${dataValidation.error.message}`,
    });
  }
  const dataParsedArray = dataValidation.data;

  const entityAnnotations: Annotation[] = [];
  dataParsedArray.forEach((item) => {
    console.log(item);

    const positions = item.position;
    const annotationsForItem: Annotation[] = lineAnnotations.filter((_, index) =>
      positions.includes(index),
    );
    const stringValue = JSON.stringify(item);

    //if there is no annotation for the item, we create a new one at position 0,0
    const mergedAnnotation =
      annotationsForItem.length === 0
        ? {
            ...createAnnotation({
              canvasId,
              collectionId,
              minX: 0,
              minY: 0,
              maxX: 200,
              maxY: 100,
              type: ElementType.TEXT_LINE,
              value: stringValue,
            }),
            order: 0,
          }
        : mergeMultipleAnnotations(annotationsForItem);

    const mergedAnnotationUpdated = changeValue(mergedAnnotation, stringValue);
    entityAnnotations.push(mergedAnnotationUpdated);
  });
  console.log('entityAnnotations: ', entityAnnotations);

  return convertW3CAnnotationsToIIIF(entityAnnotations, ['tagging']);
};
