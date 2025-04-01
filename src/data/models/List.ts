import { ListElement } from './ListElement';

export interface List {
  id?: string;
  name: string;
  content?: ListElement[];
  about?: string;
  tags: string[];
}
