import { ContentResource, Manifest } from '@iiif/presentation-3';
import { WithStringId } from './utils';

export type StoredManifestDetails = WithStringId & {
  name: string;
  thumbnail?: ContentResource;
};

export type StoredManifestContent = WithStringId & {
  content: Manifest;
};

export type StoredManifest = StoredManifestDetails & {
  content: Manifest;
};
