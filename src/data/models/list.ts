import { SelectedCanvas } from './selectedCanvas';

export interface List {
  id?: string;
  name: string;
  content?: SelectedCanvas[];
}
