import z from 'zod';
import { Annotation } from '../Annotation';

export type FieldMetadata = {
  label?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
};

export abstract class Modifier<TSchema extends z.ZodTypeAny> {
  id: string;
  name: string;
  schema: TSchema;
  fieldMeta: Record<keyof z.infer<TSchema>, FieldMetadata>;
  description?: string;
  abstract type: string;

  constructor(
    id: string,
    name: string,
    schema: TSchema,
    fieldMeta: Record<keyof z.infer<TSchema>, FieldMetadata>,
    description?: string,
  ) {
    this.id = id;
    this.name = name;
    this.schema = schema;
    this.fieldMeta = fieldMeta;
    this.description = description;
  }

  abstract apply(data: Annotation[], values: z.infer<TSchema>): Annotation[];
}

export type AnyModifier = Modifier<z.ZodObject<z.ZodRawShape>>;

export interface ModifierChain {
  id: string;
  name: string;
  description?: string;
  modifiers: Modifier<z.ZodTypeAny>[];
}
