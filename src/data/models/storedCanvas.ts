import { Canvas } from '@iiif/presentation-3';

export interface StoredCanvas {
  id: string; //url du canvas
  content: Canvas;
}
