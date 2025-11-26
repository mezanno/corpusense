import { getObjectUrl } from '@/hooks/useFs';
import { Canvas, IIIFExternalWebResource, ImageService } from '@iiif/presentation-3';
import i18next from 'i18next';
import { TileSource } from 'openseadragon';

const getLabel = (canvas: Canvas): string => {
  const label = canvas.label;

  if (!label) {
    return i18next.t('no_label');
  }

  // 1. Si c'est une simple string → on renvoie directement
  if (typeof label === 'string') {
    return label;
  }

  // 2. Si label.none existe et contient au moins un élément → on prend celui-ci
  if (Array.isArray(label.none) && label.none.length > 0) {
    return label.none[0];
  }

  // 3. Sinon, on récupère la *première langue* disponible parmi les clés (ex: en, fr, de ...)
  const [firstLang] = Object.keys(label);
  const values = label[firstLang];

  if (Array.isArray(values) && values.length > 0) {
    return values[0];
  }

  // 4. Fallback
  return i18next.t('no_label');
};

const getImage = (canvas: Canvas): IIIFExternalWebResource => {
  const image = canvas.items?.[0]?.items?.[0].body as IIIFExternalWebResource;
  if (image === undefined) {
    throw new Error(i18next.t('error_image_not_found'));
  }
  return image;
};

const getImageForThumbnail = (canvas: Canvas, maxWidth: number = 150): IIIFExternalWebResource => {
  let image = getImage(canvas);

  const regex = /\/full\/\d+,\d+\/0\/[a-z]+\.jpg$/;
  if (image.id !== undefined && !regex.test(image.id)) {
    image = {
      ...image,
      id: image.id.replace(/\/full\/(\d+,|\d+,\d+|full)/, `/full/${maxWidth},`),
    };
  }
  return image;
};

const getSource = async (canvas: Canvas): Promise<TileSource[]> => {
  const image = getImage(canvas);

  let source: TileSource[] = [];
  if (image?.service?.length != null && image.service.length > 0) {
    const service = image.service[0] as ImageService;
    if (service !== undefined) {
      const id = service['@id'] ?? service.id;
      if (id !== undefined) {
        source = [`${id}/info.json`] as unknown as TileSource[];
      }
    }
  } else {
    if (image?.id !== undefined && !image.id.startsWith('http')) {
      const url = await getObjectUrl(image.id);
      source = [{ type: 'image', url: url }] as unknown as TileSource[];
    } else {
      source = [{ type: 'image', url: image.id }] as unknown as TileSource[];
    }
  }

  return source;
};

const toGallicaUrl = (iiifUrl: string) => {
  return iiifUrl.replace(
    /https:\/\/openapi\.bnf\.fr\/iiif\/presentation\/v3\/(ark:\/12148\/[^/]+\/[^/]+)\/canvas/,
    'https://gallica.bnf.fr/$1.item',
  );
};

export { getImage, getImageForThumbnail, getLabel, getSource, toGallicaUrl };
