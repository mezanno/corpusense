import { Canvas, IIIFExternalWebResource } from '@iiif/presentation-3';
import i18next from 'i18next';

const getImage = (canvas: Canvas): IIIFExternalWebResource => {
  const image = canvas.items?.[0]?.items?.[0].body as IIIFExternalWebResource;
  if (image === undefined) {
    throw new Error(i18next.t('error_image_not_found'));
  }
  return image;
};

export { getImage };
