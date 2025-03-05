import { ListElement } from './ListElement';
import { Tag } from './Tag';

export interface List {
  id?: string;
  name: string;
  content?: ListElement[];
  about?: string;
  tags?: Tag[];
}
