import { Annotation } from '../Annotation';

export abstract class Modifier<TValues extends Record<string, number>> {
  id: string;
  name: string;
  description?: string;

  constructor(id: string, name: string, description?: string) {
    this.id = id;
    this.name = name;
    this.description = description;
  }

  abstract apply(data: Annotation[], values: TValues): Annotation[];
}

// export interface ModifierChain {
//   id: string;
//   name: string;
//   description?: string;
//   modifiers: Modifier[];
// }
