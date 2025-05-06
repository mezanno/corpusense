import { SelectedCanvas } from '@/data/models/SelectedCanvas';
import { Canvas } from '@iiif/presentation-3';
import canvasWithImage from '../../../__tests__/canvasWithImage.json';
import { generateCollectionContent } from '../collections';

describe('collection utils', () => {
  describe('generateCollectionContent', () => {
    it('should generate 0 collection content', () => {
      const position = 0;
      const selection: SelectedCanvas[] = [];
      const collectionId = 'collectionId';
      const manifestId = 'manifestId';
      const existingCanvasIds = ['canvas1', 'canvas2'];

      const result = generateCollectionContent(
        position,
        selection,
        collectionId,
        manifestId,
        existingCanvasIds,
      );
      expect(result).toHaveLength(0);
    });

    it('should generate collection content (size 2)', () => {
      const position = 0;
      const selection: SelectedCanvas[] = [
        { index: 0, canvas: { ...canvasWithImage, id: 'canvas1' } as Canvas },
        { index: 1, canvas: { ...canvasWithImage, id: 'canvas2' } as Canvas },
      ];
      const collectionId = 'collectionId';
      const manifestId = 'manifestId';

      const result = generateCollectionContent(position, selection, collectionId, manifestId);
      expect(result).toEqual([
        {
          canvasId: 'canvas1',
          collectionId,
          position: 1,
          manifestId,
        },
        {
          canvasId: 'canvas2',
          collectionId,
          position: 2,
          manifestId,
        },
      ]);
    });

    it('should generate collection content (size 1)', () => {
      const position = 0;
      const selection: SelectedCanvas[] = [
        { index: 0, canvas: { ...canvasWithImage, id: 'canvas1' } as Canvas },
        { index: 1, canvas: { ...canvasWithImage, id: 'canvas2' } as Canvas },
      ];
      const collectionId = 'collectionId';
      const manifestId = 'manifestId';
      const existingCanvasIds = ['canvas1'];

      const result = generateCollectionContent(
        position,
        selection,
        collectionId,
        manifestId,
        existingCanvasIds,
      );
      expect(result).toEqual([
        {
          canvasId: 'canvas2',
          collectionId,
          position: 1,
          manifestId,
        },
      ]);
    });
  });
});
