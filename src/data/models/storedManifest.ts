import { Manifest } from '@iiif/presentation-3';

export interface StoredManifest {
  id: string; //url du manifest
  content: Manifest;
}
