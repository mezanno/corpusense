import { convertPresentation2 } from '@iiif/parser/presentation-2';
import { Manifest } from '@iiif/presentation-3';
import i18n from 'i18next';

export function isManifestUrl(str: string): boolean {
  const regex = /^https?:\/\/[^/\s]+(?:\/\S*)?$/i;
  return regex.test(str);
}

export function containsArkIdentifier(str: string): boolean {
  const regex = /ark:\/\d{5,}\/[a-zA-Z0-9]+/;
  return regex.test(str);
}

export const convertJsonToManifest = (data: object): Manifest => {
  const manifest: Manifest = convertPresentation2(data) as Manifest;

  if (manifest === undefined) {
    throw new Error(i18n.t('error_parse_manifest'));
  }

  return manifest;
};

export type CanvasInfo = {
  id: string;
  thumb: string;
  width: number;
  height: number;
};

export const generateManifest = (
  documentName: string,
  canvasInfo: CanvasInfo[],
  folder: string,
  rootUrl?: string,
): Manifest => {
  const url_from = `${rootUrl ?? import.meta.env.VITE_SUPABASE_STORAGE_URL}/${folder}/`;

  return {
    '@context': 'http://iiif.io/api/presentation/3/context.json',
    id: `${url_from}/manifest.json`,
    type: 'Manifest',
    label: {
      fr: [documentName],
    },
    items: canvasInfo.map((canvas, index) => ({
      id: `${url_from}/canvas/p${index + 1}`,
      type: 'Canvas',
      label: {
        fr: [`Page ${index + 1}`],
      },
      height: Math.floor(canvas.height),
      width: Math.floor(canvas.width),
      thumbnail: [
        {
          id: canvas.thumb,
          type: 'Image',
          format: 'image/png',
        },
      ],
      items: [
        {
          id: `${url_from}/page/p${index + 1}/1`,
          type: 'AnnotationPage',
          items: [
            {
              id: `${url_from}/annotation/p${index + 1}/1-image`,
              type: 'Annotation',
              motivation: 'painting',
              body: {
                id: canvas.id,
                type: 'Image',
                format: 'image/png',
                width: Math.floor(canvas.width),
                height: Math.floor(canvas.height),
                service: [
                  {
                    id: canvas.id.substring(0, canvas.id.length - 23), // Retirer l'extension .png
                    type: 'ImageService3',
                    profile: 'level1',
                  },
                ],
              },
            },
          ],
        },
      ],
    })),
  };
};
