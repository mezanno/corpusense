import annotationCreateFromDTOWithId from '@/__tests__/annotationCreateFromDTOWithId.json';
import annotationFromEdwin from '@/__tests__/annotationFromEdwin.json';
import annotationWitoutTypeAndText from '@/__tests__/annotationWithoutTypeAndValue.json';
import { vi } from 'vitest';
import {
  Annotation,
  createAnnotation,
  ElementType,
  getAnnotationText,
  getAnnotationType,
  getBodies,
} from '../Annotation';

vi.mock('uuid', () => {
  return {
    v4: vi.fn(() => '799caa82-346a-475f-8689-2d6ba8ef3b65'),
  };
});

describe('Annotation', () => {
  const annotation = annotationFromEdwin[0] as Annotation;
  describe('getAnnotationType', () => {
    it('should get the correct annotation type', () => {
      const expectedType = 'ENTRY';
      expect(getAnnotationType(annotation)).toBe(expectedType);
    });

    it('should return TAG if type is undefined', () => {
      const expectedType = 'TAG';
      // @ts-expect-error annotationWitoutTypeAndText undefined type
      expect(getAnnotationType(annotationWitoutTypeAndText)).toBe(expectedType);
    });
  });

  describe('getAnnotationText', () => {
    it('should get the correct annotation value', () => {
      const expectedValue = 'title_level_1';
      expect(getAnnotationText(annotation)).toBe(expectedValue);
    });

    it('should return empty string if value is undefined', () => {
      // @ts-expect-error annotationWitoutTypeAndText undefined type
      expect(getAnnotationText(annotationWitoutTypeAndText)).toBe('');
    });
  });

  describe('getBodies', () => {
    it('should get the correct bodies', () => {
      const expectedBodies = {
        type: 'ENTRY',
        value: 'title_level_1',
      };
      expect(getBodies(annotation)).toEqual(expectedBodies);
    });
  });

  describe('createAnnotation', () => {
    it('should create a new annotation from an AnnotationCreateDTO', () => {
      const newAnnotation = createAnnotation({
        canvasId: 'https://gallica.bnf.fr/iiif/ark:/12148/bpt6k2012653g/canvas/f15',
        collectionId: 'collectionId',
        order: 1,
        minX: 146.484375,
        minY: 292.96875,
        maxX: 585.9375,
        maxY: 878.90625,
        type: ElementType.ENTRY,
        value: 'title_level_1',
      });
      expect(newAnnotation).toEqual(annotation);
    });

    it('should create a new annotation from an AnnotationWithIdCreateDTO', () => {
      const newAnnotation = createAnnotation({
        canvasId: 'https://gallica.bnf.fr/iiif/ark:/12148/bpt6k2012653g/canvas/f15',
        collectionId: 'collectionId',
        order: 1,
        id: 'anotherId',
        minX: 146.484375,
        minY: 292.96875,
        maxX: 585.9375,
        maxY: 878.90625,
        type: ElementType.ENTRY,
        value: 'title_level_1',
      });
      expect(newAnnotation).toEqual(annotationCreateFromDTOWithId);
    });
  });

  // describe('createAnnotationFromExistingAnnotation', () => {
  //   it('should create a new annotation from an existing annotation', () => {
  //     const newAnnotation = createAnnotationFromExistingAnnotation({
  //       annotation,
  //       type: ElementType.REGION,
  //       value: 'new value',
  //     });
  //     expect(newAnnotation).toEqual(annotationCreatedFromAnother);
  //   });
  // });
});
