import { Canvas } from '@iiif/presentation-3';

export interface SelectedCanvas {
  index: number; //index du canvas dans la liste des canvases
  canvas: Canvas; //données du canvas sélectionné
}
