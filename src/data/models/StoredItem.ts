import { Canvas, ContentResource, Manifest } from '@iiif/presentation-3';
import { WithStringId } from './utils';

export type StoredItemDetails = WithStringId & {
  name: string;
  parentId?: string;
  thumbnail?: ContentResource;
};

export type StoredItemContent = WithStringId & {
  content: Canvas | Manifest;
};

export type StoredItem = StoredItemDetails & {
  content: Canvas | Manifest;
};
