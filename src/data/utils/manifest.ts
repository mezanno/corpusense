import i18n from '@/i18n';
import { Canvas, Manifest } from '@iiif/presentation-3';
import { Cozy } from 'cozy-iiif';

export const extractManifestDetails = (manifest: Manifest) => {
  const parsed = Cozy.parse(manifest);

  if (parsed.type !== 'manifest') {
    throw new Error(i18n.t('error_invalid_manifest_input'));
  }
  const name = parsed.resource.getLabel() ?? i18n.t('error_manifest_empty_name');
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
