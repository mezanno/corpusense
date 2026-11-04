import z from 'zod';
import { ScopeSchema } from '../scope/scope';

export const ResultCreateDTOSchema = z
  .object({
    scope: ScopeSchema,
    workerName: z.string(),
    workerCategory: z.string().optional(),
    workerId: z.string(),
    taskId: z.number(),
    value: z.unknown(),
    params: z.unknown(),
  })
  .strict();

export type ResultCreateDTO = z.infer<typeof ResultCreateDTOSchema>;
