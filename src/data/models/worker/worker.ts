import z from 'zod';
import { ScopeSchema } from '../scope/scope';
import { WorkerCreateDTOSChema } from './worker.dto';
import { TaskStatus, WorkerEvent, WorkerStatus } from './workerStatusLaw';

export { TaskStatus, WorkerEvent, WorkerStatus } from './workerStatusLaw';

const WorkerStatusSchema = z.enum(WorkerStatus);
const TaskStatusSchema = z.enum(TaskStatus);

const TaskSchema = z
  .object({
    id: z.number(),
    scope: ScopeSchema,
    status: TaskStatusSchema,
    statusMessage: z.string().optional(),
    previousTask: z
      .object({
        workerId: z.string(),
        taskId: z.number(),
      })
      .optional(),
  })
  .strict();

export type Task = z.infer<typeof TaskSchema>;

export const WorkerSchema = WorkerCreateDTOSChema.extend({
  scopeKey: z.string(),
  status: WorkerStatusSchema,
  statusMessage: z.string().optional(),
  createdAt: z.string(),
  estimatedDuration: z.number(),
  queue: z.array(TaskSchema),
}).strict();

export type Worker = z.infer<typeof WorkerSchema>;

const WorkerResponseSchema = z
  .object({
    event: z.enum([WorkerEvent.JOB_ACCEPTED, WorkerEvent.RESULT_OK, WorkerEvent.RESULT_ERR]),
    message: z.string().optional(),
    content: z.unknown().optional(),
  })
  .strict();

export type WorkerResponse = z.infer<typeof WorkerResponseSchema>;
