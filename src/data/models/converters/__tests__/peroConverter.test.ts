import annotationsFromPero from '@/__tests__/annotationsFromPero.json';
import peroResult from '@/__tests__/peroResult.json';
import { vi } from 'vitest';
import { convertPeroTranscriptionsToAnnotations } from '../peroConverter';

vi.mock('uuid', () => {
  return {
    v4: vi.fn(() => '799caa82-346a-475f-8689-2d6ba8ef3b65'),
  };
});

describe('convertPeroTranscriptionsToAnnotations', () => {
  it('should convert all lines in peroResult to annotations', () => {
    const canvasId = 'canvasId';
    const collectionId = 'collectionId';

    //@ts-expect-error incompatible types with peroResult
    const annotations = convertPeroTranscriptionsToAnnotations(peroResult, canvasId, collectionId);
    expect(annotations).toStrictEqual(annotationsFromPero);
  });
});
