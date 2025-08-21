import { AnnotationPage, Canvas } from '@iiif/presentation-3';
import i18next from 'i18next';
import { Annotation, createAnnotation, ElementType, getAnnotationType } from '../models/Annotation';
import { convertAnnotationPageToW3CAnnotations } from '../models/converters/iiif';
import { getAnnotationRepository } from '../repositories/indexeddb/dbFactory';
import { getImage } from './canvas';

/**
 * This function checks if the annotation is contained in the annotationContainer
 * @param annotationContainer The container of the annotation
 * @param annotation The annotation to check
 * @returns true if the annotation is contained in the annotationContainer.
 * If the annotation is the same as the annotationContainer, it returns false
 */
const contains = (annotationContainer: Annotation, annotation: Annotation) => {
  if (annotationContainer.id === annotation.id) {
    return false;
  }

  const container = annotationContainer.target.selector.geometry.bounds;
  const target = annotation.target.selector.geometry.bounds;
  return (
    container.minX <= target.minX &&
    container.minY <= target.minY &&
    container.maxX >= target.maxX &&
    container.maxY >= target.maxY
  );
};

const generateRegionAnnotationForCanvas = (canvas: Canvas, collectionId: string) => {
  const image = getImage(canvas);
  if (image.width === undefined || image.height === undefined) {
    throw new Error(i18next.t('error_image_dimensions'));
  }
  return createAnnotation({
    canvasId: canvas.id,
    collectionId: collectionId,
    order: 0,
    minX: 0,
    minY: 0,
    maxX: image.width,
    maxY: image.height,
    type: ElementType.REGION,
    value: '',
  });
};

function generateFirstAnnotation(
  canvases: Canvas[],
  collectionId: string,
  existingCanvasIds: string[] = [],
) {
  const annotations = [];
  for (const canvas of canvases) {
    //si l'élément est déjà dans la liste, on ne lui ajoute pas de nouvelle annotation
    if (existingCanvasIds.includes(canvas.id)) {
      continue;
    }
    try {
      annotations.push(generateRegionAnnotationForCanvas(canvas, collectionId));
    } catch (e) {
      // console.error(e);
    }
  }
  return annotations.filter((elt) => elt !== null);
}

async function getAnnotationsByType(type: ElementType, canvasId: string, collectionId: string) {
  const annotations = await getAnnotationRepository().getAnnotationsForCanvas(
    canvasId,
    collectionId,
  );

  return annotations.filter((annotation) => getAnnotationType(annotation) === type);
}

function importAnnotationFromJson(aPage: AnnotationPage, collectionId: string) {
  console.log(`importAnnotationFromJson in - ${collectionId}: `, aPage);
  const annotationsW3C = convertAnnotationPageToW3CAnnotations(aPage, collectionId);
  console.log(`importAnnotationFromJson out - ${collectionId}: `, annotationsW3C);
  // return await db.annotations.bulkPut(annotationsW3C);
  const annotationRepository = getAnnotationRepository();
  return annotationRepository.saveAllAnnotations(annotationsW3C);
}

export {
  contains,
  generateFirstAnnotation,
  generateRegionAnnotationForCanvas,
  getAnnotationsByType,
  importAnnotationFromJson,
};
