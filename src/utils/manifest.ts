import { convertPresentation2 } from '@iiif/parser/presentation-2';
import { ManifestNormalized } from '@iiif/presentation-3-normalized';

export const convertJsonToManifest = (data: object): ManifestNormalized => {
  const manifest: ManifestNormalized = convertPresentation2(data);

  if (manifest === undefined) {
    throw new Error('Failed to parse manifest');
  }

  return manifest;
};
