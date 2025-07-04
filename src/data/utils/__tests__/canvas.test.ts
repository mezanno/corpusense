import { Canvas } from '@iiif/presentation-3';
import { describe, expect, it } from 'vitest';
import canvasWithImage from '../../../__tests__/canvasWithImage.json';
import canvasWithoutImage from '../../../__tests__/canvasWithoutImage.json';
import imageJSON from '../../../__tests__/image.json';
import { getImage } from '../canvas';

describe('canvas utils', () => {
  describe('getImage', () => {
    it('should extract image from canvas', () => {
      const result = getImage(canvasWithImage as Canvas);
      expect(result).toEqual(imageJSON);
    });

    it('should throw error when canvas has no image', () => {
      expect(() => getImage(canvasWithoutImage as Canvas)).toThrow('error_image_not_found');
    });
  });
});
