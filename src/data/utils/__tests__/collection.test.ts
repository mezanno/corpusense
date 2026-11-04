import { describe, expect, it } from 'vitest';
import { generateCollectionContent } from '../collections';

describe('collection utils', () => {
  describe('generateCollectionContent', () => {
    it('should generate 0 collection content', () => {
      const selection: string[] = [];
      const manifestId = 'manifestId';
      const existingCanvasIds = ['canvas1', 'canvas2'];

      const result = generateCollectionContent(selection, manifestId, existingCanvasIds);
      expect(result).toHaveLength(0);
    });

    it('should generate collection content (size 2)', () => {
      const selection: string[] = ['canvas1', 'canvas2'];
      const manifestId = 'manifestId';

      const result = generateCollectionContent(selection, manifestId);
      expect(result).toEqual([
        {
          canvasId: 'canvas1',
          sourceId: manifestId,
        },
        {
          canvasId: 'canvas2',
          sourceId: manifestId,
        },
      ]);
    });

    it('should generate collection content (size 1)', () => {
      const selection: string[] = ['canvas1', 'canvas2'];
      const manifestId = 'manifestId';
      const existingCanvasIds = ['canvas1'];

      const result = generateCollectionContent(selection, manifestId, existingCanvasIds);
      expect(result).toEqual([
        {
          canvasId: 'canvas2',
          sourceId: manifestId,
        },
      ]);
    });
  });
});
