import { IIIFResource, parseManifest } from 'manifesto.js';

export const convertJsonToManifest = (json): IIIFResource => {
  const manifest = parseManifest(json);

  if (manifest === null) {
    throw new Error('Failed to parse manifest');
  }

  return manifest;
};
