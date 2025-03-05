import { Canvas, Manifest } from '@iiif/presentation-3';

export interface StoredItem {
  id: string;
  content: Canvas | Manifest;
}
