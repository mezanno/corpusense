import { generateCollectionContent } from '../collections';

describe('collection utils', () => {
  describe('generateCollectionContent', () => {
    it('should generate 0 collection content', () => {
      const position = 0;
      const selection: string[] = [];
      const manifestId = 'manifestId';
      const existingCanvasIds = ['canvas1', 'canvas2'];

      const result = generateCollectionContent(position, selection, manifestId, existingCanvasIds);
      expect(result).toHaveLength(0);
    });

    it('should generate collection content (size 2)', () => {
      const position = 0;
      const selection: string[] = ['canvas1', 'canvas2'];
      const manifestId = 'manifestId';

      const result = generateCollectionContent(position, selection, manifestId);
      expect(result).toEqual([
        {
          canvasId: 'canvas1',
          position: 1,
          manifestId,
        },
        {
          canvasId: 'canvas2',
          position: 2,
          manifestId,
        },
      ]);
    });

    it('should generate collection content (size 1)', () => {
      const position = 0;
      const selection: string[] = ['canvas1', 'canvas2'];
      const manifestId = 'manifestId';
      const existingCanvasIds = ['canvas1'];

      const result = generateCollectionContent(position, selection, manifestId, existingCanvasIds);
      expect(result).toEqual([
        {
          canvasId: 'canvas2',
          position: 1,
          manifestId,
        },
      ]);
    });
  });
});
