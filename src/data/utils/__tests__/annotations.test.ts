import { Canvas } from '@iiif/presentation-3';
import annotation from '../../../__tests__/annotationFromImage.json';
import canvasWithImage from '../../../__tests__/canvasWithImage.json';
import canvasWithNoDimensions from '../../../__tests__/canvasWithNoDimensions.json';
import canvasWithoutImage from '../../../__tests__/canvasWithoutImage.json';
import { generateFirstAnnotation, generateRegionAnnotationForCanvas } from '../annotations';

import { SelectedCanvas } from '@/data/models/SelectedCanvas';
import { vi } from 'vitest';

vi.mock('uuid', () => {
  return {
    v4: vi.fn(() => '799caa82-346a-475f-8689-2d6ba8ef3b65'),
  };
});

describe('annotations utils', () => {
  describe('generatePageAnnotationForCanvas', () => {
    it('should generate a region annotation for canvas', () => {
      const collectionId = 'collectionId';
      const result = generateRegionAnnotationForCanvas(canvasWithImage as Canvas, collectionId);

      expect(result).toEqual(annotation);
    });

    it('should throw error when image is undefined', () => {
      const collectionId = 'collectionId';
      expect(() =>
        generateRegionAnnotationForCanvas(canvasWithoutImage as Canvas, collectionId),
      ).toThrow('error_image_not_found');
    });

    it('should throw error when image width or height is undefined', () => {
      const collectionId = 'collectionId';
      expect(() =>
        generateRegionAnnotationForCanvas(canvasWithNoDimensions as Canvas, collectionId),
      ).toThrow('error_image_dimensions');
    });
  });

  describe('generateFirstAnnotation', () => {
    it('should generate no annotation', () => {
      const collectionId = 'collectionId';
      const selection: SelectedCanvas[] = [];

      const result = generateFirstAnnotation(selection, collectionId);

      expect(result).toHaveLength(0);
    });

    it('3 canvases should generate only 1 annotation because of errors', () => {
      const collectionId = 'collectionId';
      const selection: SelectedCanvas[] = [
        { index: 0, canvas: canvasWithImage as Canvas },
        { index: 1, canvas: canvasWithNoDimensions as Canvas },
        { index: 2, canvas: canvasWithoutImage as Canvas },
      ];

      const result = generateFirstAnnotation(selection, collectionId);

      expect(result).toHaveLength(1);
    });

    it('2 canvases should generate 2 annotations', () => {
      const collectionId = 'collectionId';
      const selection: SelectedCanvas[] = [
        { index: 0, canvas: canvasWithImage as Canvas },
        { index: 1, canvas: canvasWithImage as Canvas },
      ];

      const result = generateFirstAnnotation(selection, collectionId);

      expect(result).toHaveLength(2);
    });

    it('2 canvases should generate 1 annotation when 1 id exists', () => {
      const collectionId = 'collectionId';
      const canvasId = 'canvsaId';
      const existingCanvasIds = [canvasId];
      const selection: SelectedCanvas[] = [
        { index: 0, canvas: { ...canvasWithImage, id: canvasId } as Canvas },
        { index: 1, canvas: canvasWithImage as Canvas },
      ];

      const result = generateFirstAnnotation(selection, collectionId, existingCanvasIds);

      expect(result).toHaveLength(1);
    });
  });
});
