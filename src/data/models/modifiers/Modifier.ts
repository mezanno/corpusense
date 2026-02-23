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

export type StringFieldMetadata = BaseFieldMetadata & {
  placeholder?: string;
};

export type EnumFieldMetadata<T extends string = string> = BaseFieldMetadata & {
  options?: readonly T[];
};

type FieldMetadataFor<T> = T extends number
  ? NumberFieldMetadata
  : T extends boolean
    ? BaseFieldMetadata
    : T extends string
      ? string extends T
        ? StringFieldMetadata
        : EnumFieldMetadata<string>
      : BaseFieldMetadata;

export function isNumberFieldMeta(meta: BaseFieldMetadata): meta is NumberFieldMetadata {
  return 'min' in meta || 'max' in meta || 'step' in meta;
}

export function isStringFieldMeta(meta: BaseFieldMetadata): meta is StringFieldMetadata {
  return 'placeholder' in meta;
}

export function isEnumFieldMeta(meta: BaseFieldMetadata): meta is EnumFieldMetadata {
  return 'options' in meta;
}

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

export interface ModifierDTO {
  id: string;
  type: string;
  values: unknown;
}
export interface ModifierChainDTO {
  id: string;
  name: string;
  description?: string;
  modifiers: ModifierDTO[];
}
