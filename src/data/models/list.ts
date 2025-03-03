import { ListElement } from './listElement';

export interface List {
  id?: string;
  name: string;
  content?: ListElement[];
}
