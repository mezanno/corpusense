import { Canvas, IIIFExternalWebResource } from '@iiif/presentation-3';

const getImage = (canvas: Canvas): IIIFExternalWebResource => {
  const image = canvas.items?.[0]?.items?.[0].body as IIIFExternalWebResource;
  if (image === undefined) {
    throw new Error('No image found in canvas');
  }
  return image;
};

export { getImage };
