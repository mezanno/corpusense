import { Canvas, Manifest } from '@iiif/presentation-3';
import i18n from '@/i18n';

export const extractManifestDetails = (manifest: Manifest) => {
  const summaryNone = manifest.summary?.['none'];
  const labelNone = manifest.label?.['none'];
  const name =
    Array.isArray(summaryNone) && summaryNone[0]
      ? summaryNone[0]
      : Array.isArray(labelNone) && labelNone[0]
        ? labelNone[0]
        : '';
  const thumbnail = manifest.thumbnail?.[0];

  return { name, thumbnail };
};

export const extractCanvasById = (manifest: Manifest, canvasId: string): Canvas => {
  const canvas = manifest.items?.find((item) => item.id === canvasId);
  if (!canvas) {
    throw new Error(i18n.t('error_canvas_not_found'));
  }
  return canvas;
};

export const extractCanvasesByIds = (manifest: Manifest, canvasIds: string[]): Canvas[] => {
  return manifest.items?.filter((item) => canvasIds.includes(item.id)) ?? [];
};
