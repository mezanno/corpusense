import { Manifest } from '@iiif/presentation-3';
import { CollectionElement } from './CollectionElement';
import { Tag } from './Tag';
import { WithStringId } from './utils';

export type CollectionDetails = WithStringId & {
  name: string;
  about?: string;
  tags: string[];
  modelId?: string;
  contentSize: number;
  offline: boolean;
};

export type CollectionContent = WithStringId & {
  content: CollectionElement[];
};

export type Collection = CollectionDetails & {
  content: CollectionElement[];
};

export interface ExportedCollection extends Manifest {
  tags: Tag[];
}
