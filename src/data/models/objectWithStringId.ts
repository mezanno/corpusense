import z from 'zod';

export const ObjectWithStringIdSchema = z
  .object({
    id: z.string(),
  })
  .strict();
