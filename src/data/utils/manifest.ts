import i18n from '@/i18n';
import { Canvas, Manifest } from '@iiif/presentation-3';
import { Cozy } from 'cozy-iiif';
import { CanvasNotFoundError, InvalidManifestError } from './errors';

export const extractManifestDetails = (manifest: Manifest) => {
  const parsed = Cozy.parse(manifest);

  if (parsed.type !== 'manifest') {
    throw new InvalidManifestError({ manifestId: manifest.id });
  }
  const name =
    parsed.resource.getSummary() ??
    parsed.resource.getLabel() ??
    i18n.t('error_manifest_empty_name');
  const thumbnail = manifest.thumbnail?.[0];

  return { name, thumbnail };
};

export const extractCanvasById = (manifest: Manifest, canvasId: string): Canvas => {
  const canvas = manifest.items?.find((item) => item.id === canvasId);
  if (!canvas) {
    throw new CanvasNotFoundError({ canvasId });
  }
  return canvas;
};

export const extractCanvasesByIds = (manifest: Manifest, canvasIds: string[]): Canvas[] => {
  return manifest.items?.filter((item) => canvasIds.includes(item.id)) ?? [];
};

export const getThumbnailBlob = async (manifest: Manifest): Promise<Blob> => {
  const thumbnailURL = manifest.thumbnail?.[0]?.id;
  return thumbnailURL !== undefined
    ? await fetch(thumbnailURL)
        .then((response) => response.blob())
        .catch((error) => {
          console.warn('Error fetching thumbnail: ', error);
          return new Blob();
        })
    : new Blob();
};
