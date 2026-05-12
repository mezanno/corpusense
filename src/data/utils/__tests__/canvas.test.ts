import { Canvas } from '@iiif/presentation-3';
import { describe, expect, it, vi } from 'vitest';
import canvasWithImage from '../../../__tests__/canvasWithImage.json';
import canvasWithoutImage from '../../../__tests__/canvasWithoutImage.json';
import imageJSON from '../../../__tests__/image.json';
import { getImage, getImageForThumbnail, getLabel, toGallicaUrl } from '../canvas';

vi.mock('i18next', () => ({
  default: {
    t: vi.fn((key: string) => key),
  },
}));

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

  describe('getLabel', () => {
    it('should return label when it is a string', () => {
      const canvas = { label: 'Simple Label' } as unknown as Canvas;
      expect(getLabel(canvas)).toBe('Simple Label');
    });

    it('should return label from none key if it is an array', () => {
      const canvas = { label: { none: ['Label in None'] } } as unknown as Canvas;
      expect(getLabel(canvas)).toBe('Label in None');
    });

    it('should return label from first available language', () => {
      const canvas = {
        label: { fr: ['Label en Français'], en: ['Label in English'] },
      } as unknown as Canvas;
      expect(getLabel(canvas)).toBe('Label en Français');
    });

    it('should return no_label if label is missing', () => {
      const canvas = {} as unknown as Canvas;
      expect(getLabel(canvas)).toBe('no_label');
    });
  });

  describe('getImageForThumbnail', () => {
    it('should modify image id to include maxWidth for non-thumbnail urls', () => {
      const canvas = {
        items: [
          {
            items: [
              {
                body: {
                  id: 'https://example.com/iiif/image1/full/full/0/default.jpg',
                  type: 'Image',
                },
              },
            ],
          },
        ],
      } as unknown as Canvas;
      const result = getImageForThumbnail(canvas, 100);
      expect(result.id).toBe('https://example.com/iiif/image1/full/100,/0/default.jpg');
    });

    it('should not modify image id if it already matches specialized thumbnail pattern', () => {
      const canvas = {
        items: [
          {
            items: [
              {
                body: {
                  id: 'https://example.com/iiif/image1/full/150,150/0/default.jpg',
                  type: 'Image',
                },
              },
            ],
          },
        ],
      } as unknown as Canvas;
      const result = getImageForThumbnail(canvas, 100);
      expect(result.id).toBe('https://example.com/iiif/image1/full/150,150/0/default.jpg');
    });
  });

  describe('toGallicaUrl', () => {
    it('should convert Gallica IIIF URL to item URL', () => {
      const iiifUrl =
        'https://openapi.bnf.fr/iiif/presentation/v3/ark:/12148/bpt6k12410870/canvas/p1';
      expect(toGallicaUrl(iiifUrl)).toBe('https://gallica.bnf.fr/ark:/12148/bpt6k12410870.item');
    });

    it('should return same URL if it does not match Gallica pattern', () => {
      const url = 'https://example.com/manifest.json';
      expect(toGallicaUrl(url)).toBe(url);
    });
  });
});
