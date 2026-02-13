import z from 'zod';
import { Annotation } from '../Annotation';

export type BaseFieldMetadata = {
  label?: string;
  description?: string;
};

export type NumberFieldMetadata = BaseFieldMetadata & {
  min?: number;
  max?: number;
  step?: number;
};

export type StringFieldMetadata<T extends string = string> = BaseFieldMetadata & {
  placeholder?: string;
  options?: readonly T[];
};

export type EnumFieldMetadata<T extends string = string> = BaseFieldMetadata & {
  options?: readonly T[];
};

type FieldMetadataFor<T> = T extends number
  ? NumberFieldMetadata
  : T extends string
    ? StringFieldMetadata
    : T extends boolean
      ? BaseFieldMetadata
      : BaseFieldMetadata;

export abstract class Modifier<TSchema extends z.ZodTypeAny> {
  id: string;
  name: string;
  schema: TSchema;
  fieldMeta: {
    [K in keyof z.infer<TSchema>]: FieldMetadataFor<z.infer<TSchema>[K]>;
  };
  description?: string;
  abstract type: string;

  constructor(
    id: string,
    name: string,
    schema: TSchema,
    fieldMeta: {
      [K in keyof z.infer<TSchema>]: FieldMetadataFor<z.infer<TSchema>[K]>;
    },
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
