import { AnnotationPage } from '@iiif/presentation-3';
import { db } from '../db';
import { Annotation } from '../models/Annotation';
import { convertAnnotationPageToW3CAnnotations } from '../models/converters/iiif';
import { getCanvasesByCollectionId } from './collections';

const importAnnotationFromJson = async (aPage: AnnotationPage) => {
  console.log('importAnnotationFromJson - ', aPage);
  const annotationsW3C = convertAnnotationPageToW3CAnnotations(aPage);
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

export { importAnnotationFromJson, removeAllAnnotations, saveAllAnnotations };
