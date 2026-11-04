import z from 'zod';

const DataFieldSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    description: z.string().optional(),
    generated: z.boolean().optional(),
    isArray: z.boolean().optional(),
    getPreviousValue: z.boolean().optional(),
    color: z.string(),
  })
  .strict();

export type DataField = z.infer<typeof DataFieldSchema>;

export const DataModelSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    prompt: z.string(),
    fields: z.array(DataFieldSchema),
  })
  .strict();

export type DataModel = z.infer<typeof DataModelSchema>;
