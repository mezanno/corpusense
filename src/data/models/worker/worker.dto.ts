import z from 'zod';
import { ScopeSchema } from '../scope/scope';

export const WorkerCreateDTOSChema = z
  .object({
    id: z.string(),
    name: z.string(),
    scope: ScopeSchema,
    params: z.unknown(),
  })
  .strict();

export type WorkerCreateDTO = z.infer<typeof WorkerCreateDTOSChema>;
