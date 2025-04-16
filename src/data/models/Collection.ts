import { Manifest } from '@iiif/presentation-3';
import { CollectionElement } from './CollectionElement';
import { Tag } from './Tag';

export interface Collection {
  id?: string;
  name: string;
  content: CollectionElement[];
  about?: string;
  tags: string[];
}

export interface ExportedCollection extends Manifest {
  tags: Tag[];
}
