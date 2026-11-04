import z from 'zod';
import { ObjectWithStringIdSchema } from './objectWithStringId';

export const TagSchema = ObjectWithStringIdSchema.extend({
  label: z.string(),
  category: z.string().optional(),
}).strict();

export type Tag = z.infer<typeof TagSchema>;
