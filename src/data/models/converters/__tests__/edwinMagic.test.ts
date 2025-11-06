import annotationFromEdwin from '@/__tests__/annotationFromEdwin.json';
import { vi } from 'vitest';
import { convertEdwinResult, EdwinBox } from '../edwinMagic';

vi.mock('uuid', () => {
  return {
    v4: vi.fn(() => '799caa82-346a-475f-8689-2d6ba8ef3b65'),
  };
});

describe('Edwin Magic Converter', () => {
  describe('convertEdwinResult', () => {
    it('should convert EdwinBox array to Annotation array', () => {
      const boxes: EdwinBox[] = [
        { id: 1, parent: 0, type: 'title_level_1', box: [100, 200, 300, 400] },
      ];
      const canvasId = 'https://gallica.bnf.fr/iiif/ark:/12148/bpt6k2012653g/canvas/f15';
      const collectionId = 'collectionId';
      const originalWidth = 3000;

      const results = convertEdwinResult(boxes, canvasId, collectionId, originalWidth);

      expect(results).toStrictEqual(annotationFromEdwin);
    });
  });
});
