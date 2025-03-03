import { Canvas, Manifest } from '@iiif/presentation-3';

export interface StoredElement {
  id: string;
  content: Canvas | Manifest;
}
