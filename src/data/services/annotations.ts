import { AnnotationPage, Canvas } from '@iiif/presentation-3';
import { db } from '../db';
import { Annotation, createAnnotation, ElementType } from '../models/Annotation';
import { convertAnnotationPageToW3CAnnotations } from '../models/converters/iiif';
import { SelectedCanvas } from '../models/SelectedCanvas';
import { getImage } from './canvas';
import { getCanvasesByCollectionId } from './collections';

const getAnnotationsForCanvas = async (canvasId: string, collectionId: string) => {
  return db.annotations
    .where({
      canvasId,
      collectionId,
    })
    .toArray();
};

const importAnnotationFromJson = async (aPage: AnnotationPage, collectionId: string) => {
  console.log('importAnnotationFromJson - ', aPage);
  const annotationsW3C = convertAnnotationPageToW3CAnnotations(aPage, collectionId);
  return await db.annotations.bulkPut(annotationsW3C);
};

const saveAllAnnotations = async (annotations: Annotation[]) => {
  for (const annotation of annotations) {
    await db.annotations.put(annotation);
  }
};

const removeAllAnnotations = async (collectionId: string) => {
  const canvases = await getCanvasesByCollectionId(collectionId);
  const canvasIds = canvases.map((canvas) => canvas.id);
  await db.annotations.where('canvasId').anyOf(canvasIds).delete();
  return canvasIds;
};

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
    type: ElementType.PAGE,
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

export {
  generateFirstAnnotation,
  generatePageAnnotationForCanvas,
  getAnnotationsForCanvas,
  importAnnotationFromJson,
  removeAllAnnotations,
  saveAllAnnotations,
};
