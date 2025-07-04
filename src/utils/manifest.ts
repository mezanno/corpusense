import { convertPresentation2 } from '@iiif/parser/presentation-2';
import { Manifest } from '@iiif/presentation-3';
import i18n from 'i18next';

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

export const generateManifest = (canvasInfo: CanvasInfo[], folder: string): Manifest => {
  const url_supabase = `${import.meta.env.VITE_SUPABASE_STORAGE_URL}/${folder}/`;

  return {
    '@context': 'http://iiif.io/api/presentation/3/context.json',
    id: `${url_supabase}/manifest.json`,
    type: 'Manifest',
    label: {
      fr: ['Simple Manifest - Book'],
    },
    items: canvasInfo.map((canvas, index) => ({
      id: `${url_supabase}/canvas/p${index + 1}`,
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
          id: `${url_supabase}/page/p${index + 1}/1`,
          type: 'AnnotationPage',
          items: [
            {
              id: `${url_supabase}/annotation/p${index + 1}/1-image`,
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
