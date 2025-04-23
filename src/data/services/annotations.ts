import { AnnotationPage } from '@iiif/presentation-3';
import { db } from '../db';
import { Annotation } from '../models/Annotation';
import { convertAnnotationPageToW3CAnnotations } from '../models/converters/iiif';

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

export { importAnnotationFromJson, saveAllAnnotations };
