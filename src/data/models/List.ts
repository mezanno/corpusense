import { Manifest } from '@iiif/presentation-3';
import { ListElement } from './ListElement';
import { Tag } from './Tag';

export interface List {
  id?: string;
  name: string;
  content?: ListElement[];
  about?: string;
  tags: string[];
}

export interface ExportedCollection extends Manifest {
  tags: Tag[];
}
