import { AnnotationPage, Canvas } from '@iiif/presentation-3';
import { createAnnotation, ElementType } from '../models/Annotation';
import { convertAnnotationPageToW3CAnnotations } from '../models/converters/iiif';
import { SelectedCanvas } from '../models/SelectedCanvas';
import { getAnnotationRepository } from '../repositories/indexeddb/dbFactory';
import { getImage } from './canvas';

const generatePageAnnotationForCanvas = (canvas: Canvas, collectionId: string) => {
  const image = getImage(canvas);
  if (image.width === undefined || image.height === undefined) {
    throw new Error('Image width or height is undefined');
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
  selection: SelectedCanvas[],
  collectionId: string,
  existingCanvasIds: string[] = [],
) {
  return selection
    .map((elt) =>
      existingCanvasIds.includes(elt.canvas.id)
        ? null
        : generatePageAnnotationForCanvas(elt.canvas, collectionId),
    )
    .filter((elt) => elt !== null);
}

function importAnnotationFromJson(aPage: AnnotationPage, collectionId: string) {
  console.log(`importAnnotationFromJson in - ${collectionId}: `, aPage);
  const annotationsW3C = convertAnnotationPageToW3CAnnotations(aPage, collectionId);
  console.log(`importAnnotationFromJson out - ${collectionId}: `, annotationsW3C);
  // return await db.annotations.bulkPut(annotationsW3C);
  const annotationRepository = getAnnotationRepository();
  return annotationRepository.saveAllAnnotations(annotationsW3C);
}

export { generateFirstAnnotation, generatePageAnnotationForCanvas, importAnnotationFromJson };
