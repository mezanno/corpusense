import { Canvas, IIIFExternalWebResource } from '@iiif/presentation-3';
import i18next from 'i18next';

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

const toGallicaUrl = (iiifUrl: string) => {
  return iiifUrl.replace(
    /https:\/\/openapi\.bnf\.fr\/iiif\/presentation\/v3\/(ark:\/12148\/[^/]+\/[^/]+)\/canvas/,
    'https://gallica.bnf.fr/$1.item',
  );
};

export { getImage, getImageForThumbnail, toGallicaUrl };
