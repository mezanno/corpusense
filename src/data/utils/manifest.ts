import { Canvas, Manifest } from '@iiif/presentation-3';
import i18next from 'i18next';

export const getCanvasById = (manifest: Manifest, canvasId: string): Canvas => {
  const canvas = manifest.items?.find((item) => item.id === canvasId);
  if (!canvas) {
    throw new Error(i18next.t('error_canvas_not_found'));
  }
  return canvas;
};

export const getCanvasesByIds = (manifest: Manifest, canvasIds: string[]): Canvas[] => {
  return manifest.items?.filter((item) => canvasIds.includes(item.id)) ?? [];
};
