import annotationPageFromW3C from '@/__tests__/annotationPageFromW3C.json';
import w3cAnnotations from '@/__tests__/w3cAnnotations.json';
import { AnnotationPage } from '@iiif/presentation-3';
import { vi } from 'vitest';
import { Annotation } from '../../Annotation';
import { convertAnnotationPageToW3CAnnotations, convertW3CAnnotationsToIIIF } from '../iiif';

vi.mock('uuid', () => {
  return {
    v4: vi.fn(() => '799caa82-346a-475f-8689-2d6ba8ef3b65'),
  };
});

describe('iiif', () => {
  describe('convertW3CAnnotationsToIIIF', () => {
    it('should convert W3C annotations to IIIF', () => {
      //@ts-expect-error incompatible types with peroResult
      const annotationPage = convertW3CAnnotationsToIIIF(w3cAnnotations);
      expect(annotationPage).toStrictEqual(annotationPageFromW3C);
    });
    it('should throw an error if annotations is empty', () => {
      const emptyAnnotations: Annotation[] = [];
      expect(() => convertW3CAnnotationsToIIIF(emptyAnnotations)).toThrow(
        'Error during convertion from W3CAnnotations to IIIF: annotations is empty',
      );
    });
  });
  describe('convertAnnotationPageToW3CAnnotations', () => {
    it('should convert IIIF annotation page to W3C annotations', () => {
      const result = convertAnnotationPageToW3CAnnotations(
        annotationPageFromW3C as AnnotationPage,
        'collectionId',
      );
      expect(result).toStrictEqual(w3cAnnotations);
    });
  });
});
