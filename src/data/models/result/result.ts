import z from 'zod';
import { ResultCreateDTOSchema } from './result.dto';

export const ResultSchema = ResultCreateDTOSchema.extend({
  id: z.number(),
  scopeKey: z.string(),
}).strict();

export type Result = z.infer<typeof ResultSchema>;
