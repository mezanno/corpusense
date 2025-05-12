import { convertPresentation2 } from '@iiif/parser/presentation-2';
import { describe, expect, it, Mock, vi } from 'vitest';
import { convertJsonToManifest } from '../manifest';

vi.mock('@iiif/parser/presentation-2', () => ({
  convertPresentation2: vi.fn(),
}));

describe('convertJsonToManifest', () => {
  const inputJson = { id: 'input-json', type: 'Manifest' };
  const expectedManifest = { id: 'test-id', type: 'Manifest' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should convert json data to manifest using convertPresentation2', () => {
    (convertPresentation2 as Mock).mockReturnValue(expectedManifest);
    const result = convertJsonToManifest(inputJson);
    expect(convertPresentation2).toHaveBeenCalledWith(inputJson);
    expect(result).toEqual(expectedManifest);
  });

  it('should throw an error if manifest is undefined', () => {
    (convertPresentation2 as Mock).mockReturnValue(undefined);
    expect(() => convertJsonToManifest(inputJson)).toThrow('error_parse_manifest');
  });
});
