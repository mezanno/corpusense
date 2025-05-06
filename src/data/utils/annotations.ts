import { AnnotationPage, Canvas } from '@iiif/presentation-3';
import i18next from 'i18next';
import { createAnnotation, ElementType } from '../models/Annotation';
import { convertAnnotationPageToW3CAnnotations } from '../models/converters/iiif';
import { SelectedCanvas } from '../models/SelectedCanvas';
import { getAnnotationRepository } from '../repositories/indexeddb/dbFactory';
import { getImage } from './canvas';

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
  selection: SelectedCanvas[],
  collectionId: string,
  existingCanvasIds: string[] = [],
) {
  const annotations = [];
  for (const elt of selection) {
    //si l'élément est déjà dans la liste, on ne lui ajoute pas de nouvelle annotation
    if (existingCanvasIds.includes(elt.canvas.id)) {
      continue;
    }
    try {
      annotations.push(generateRegionAnnotationForCanvas(elt.canvas, collectionId));
    } catch (e) {
      // console.error(e);
    }
  }
  return annotations.filter((elt) => elt !== null);
}

function importAnnotationFromJson(aPage: AnnotationPage, collectionId: string) {
  console.log(`importAnnotationFromJson in - ${collectionId}: `, aPage);
  const annotationsW3C = convertAnnotationPageToW3CAnnotations(aPage, collectionId);
  console.log(`importAnnotationFromJson out - ${collectionId}: `, annotationsW3C);
  // return await db.annotations.bulkPut(annotationsW3C);
  const annotationRepository = getAnnotationRepository();
  return annotationRepository.saveAllAnnotations(annotationsW3C);
}

export { generateFirstAnnotation, generateRegionAnnotationForCanvas, importAnnotationFromJson };
