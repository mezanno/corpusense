import { convertPresentation2 } from '@iiif/parser/presentation-2';
import { Manifest } from '@iiif/presentation-3';
// import { ManifestNormalized } from '@iiif/presentation-3-normalized';

export const convertJsonToManifest = (data: object): Manifest => {
  const manifest: Manifest = convertPresentation2(data) as Manifest;

  if (manifest === undefined) {
    throw new Error('Failed to parse manifest');
  }

  return manifest;
};
