import { AnnotationPage } from '@iiif/presentation-3';
import { db } from '../db';
import { convertAnnotationPageToW3CAnnotations } from '../models/converters/iiif';

const importAnnotationFromJson = async (aPage: AnnotationPage) => {
  console.log('importAnnotationFromJson - ', aPage);
  const annotationsW3C = convertAnnotationPageToW3CAnnotations(aPage);
  return await db.annotations.bulkPut(annotationsW3C);
};

export { importAnnotationFromJson };
