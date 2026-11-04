import { ImageAnnotation } from '@annotorious/annotorious';
import { z } from 'zod';

export enum ElementType {
  UNKNOWN = 'UNKNOWN',
  TEXT_LINE = 'TEXT_LINE',
  TEXT_REGION = 'TEXT_REGION',
  TEMP = 'TEMP',
}

const ElementTypeSchema = z.enum(ElementType);

const AnnotationSchema = z.object({
  canvasId: z.string(),
  collectionId: z.string(),
  order: z.number(),
  type: ElementTypeSchema,
  partOf: z.string().optional(),
  previous: z.string().optional(),
  next: z.string().optional(),
});

export type Annotation = ImageAnnotation & z.infer<typeof AnnotationSchema>;
