import z from 'zod';
import { Annotation } from '../Annotation';

export abstract class Modifier<TSchema extends z.ZodTypeAny> {
  id: string;
  name: string;
  schema: TSchema;

  constructor(id: string, name: string, schema: TSchema) {
    this.id = id;
    this.name = name;
    this.schema = schema;
  }

  abstract apply(data: Annotation[], values: z.infer<TSchema>): Annotation[];
}

export interface ModifierChain {
  id: string;
  name: string;
  description?: string;
  modifiers: Modifier<z.ZodTypeAny>[];
}
