import { BaseError } from '@/utils/BaseError';
import { FunctionResult } from '@/utils/functionResult';
import type { Task, Worker } from './worker';

export enum WorkerStatus {
  INPROGRESS = 'inprogress',
  INPROGRESS_WITH_ERRORS = 'inprogress_with_errors',
  COMPLETED = 'completed',
  COMPLETED_WITH_ERRORS = 'completed_with_errors',
  UNFINISHED = 'unfinished',
  UNFINISHED_WITH_ERRORS = 'unfinished_with_errors',
}

export enum TaskStatus {
  WAITING = 'waiting',
  POSTING = 'posting',
  POSTED = 'posted',
  INPROGRESS = 'inprogress',
  COMPLETED = 'completed',
  COMPLETED_WITH_ERRORS = 'completed_with_errors',
}

export enum WorkerEvent {
  START = 'START',
  POST = 'POST',
  JOB_ACCEPTED = 'JOB_ACCEPTED',
  RESULT_OK = 'RESULT_OK',
  RESULT_ERR = 'RESULT_ERR',
  REQUEUE = 'REQUEUE',
  INTERRUPT = 'INTERRUPT',
  JOB_PAUSED = 'JOB_PAUSED',
  JOB_DELIVERED = 'JOB_DELIVERED',
  POST_TIMEOUT = 'POST_TIMEOUT',
}

export type TaskEvent =
  | { type: WorkerEvent.START }
  | { type: WorkerEvent.POST }
  | { type: WorkerEvent.JOB_ACCEPTED }
  | { type: WorkerEvent.RESULT_OK }
  | { type: WorkerEvent.RESULT_ERR }
  | { type: WorkerEvent.REQUEUE }
  | { type: WorkerEvent.JOB_PAUSED }
  | { type: WorkerEvent.JOB_DELIVERED; jobStatus: string }
  | { type: WorkerEvent.POST_TIMEOUT };

export type WorkerLifecycleEvent = { type: WorkerEvent.INTERRUPT } | { type: WorkerEvent.REQUEUE };

type Status = TaskStatus | WorkerStatus;

export class StatusChangeError extends BaseError {
  constructor(context: {
    status: Status | string;
    event: WorkerEvent | string;
    workerId?: string;
    taskId?: number;
  }) {
    super(`Status ${context.status} cannot transition on ${context.event}`, { context });
  }
}

const jobStatusMap: Partial<Record<string, TaskStatus>> = {
  pending: TaskStatus.POSTED,
  processing: TaskStatus.INPROGRESS,
  completed: TaskStatus.COMPLETED,
  failed: TaskStatus.COMPLETED_WITH_ERRORS,
  paused: TaskStatus.POSTED,
};

export const isTaskTerminal = (status: TaskStatus): boolean =>
  status === TaskStatus.COMPLETED || status === TaskStatus.COMPLETED_WITH_ERRORS;

export const isTaskCompleted = (status: TaskStatus): boolean => status === TaskStatus.COMPLETED;

export const isTaskRunning = (status: TaskStatus): boolean => status === TaskStatus.INPROGRESS;

export const isTaskWaiting = (status: TaskStatus): boolean => status === TaskStatus.WAITING;

export const isTaskPosting = (status: TaskStatus): boolean => status === TaskStatus.POSTING;

export const isTaskPendingOrRunning = (status: TaskStatus): boolean =>
  status === TaskStatus.WAITING || status === TaskStatus.POSTING || isTaskRunning(status);

export const isTaskCapacityBlocking = (status: TaskStatus): boolean =>
  status === TaskStatus.WAITING || isTaskRunning(status);

export const isTaskJobTracked = (status: TaskStatus): boolean =>
  status === TaskStatus.POSTED || isTaskRunning(status);

export const isWorkerInProgress = (status: WorkerStatus): boolean =>
  status === WorkerStatus.INPROGRESS || status === WorkerStatus.INPROGRESS_WITH_ERRORS;

export const isWorkerUnfinished = (status: WorkerStatus): boolean =>
  status === WorkerStatus.UNFINISHED || status === WorkerStatus.UNFINISHED_WITH_ERRORS;

export const isWorkerCompleted = (status: WorkerStatus): boolean =>
  status === WorkerStatus.COMPLETED || status === WorkerStatus.COMPLETED_WITH_ERRORS;

export const hasWorkerErrors = (status: WorkerStatus): boolean =>
  status === WorkerStatus.INPROGRESS_WITH_ERRORS ||
  status === WorkerStatus.UNFINISHED_WITH_ERRORS ||
  status === WorkerStatus.COMPLETED_WITH_ERRORS;

export const canRecoverWorker = (status: WorkerStatus): boolean =>
  isWorkerUnfinished(status) || status === WorkerStatus.COMPLETED_WITH_ERRORS;

export const canInterruptWorker = isWorkerInProgress;

export function taskStatusOfJobStatus(
  jobStatus: string,
): FunctionResult<TaskStatus, StatusChangeError> {
  const status = jobStatusMap[jobStatus];
  return status === undefined
    ? FunctionResult.err(
        new StatusChangeError({ status: jobStatus, event: WorkerEvent.JOB_DELIVERED }),
      )
    : FunctionResult.ok(status);
}

export function transitionTaskStatus(
  status: TaskStatus,
  event: TaskEvent,
  workerId?: string,
  taskId?: number,
): FunctionResult<TaskStatus, StatusChangeError> {
  let nextStatus: TaskStatus | undefined;

  switch (event.type) {
    case WorkerEvent.START:
      if (status === TaskStatus.WAITING) nextStatus = TaskStatus.INPROGRESS;
      break;
    case WorkerEvent.POST:
      if (status === TaskStatus.WAITING) nextStatus = TaskStatus.POSTING;
      break;
    case WorkerEvent.JOB_ACCEPTED:
      if (status === TaskStatus.POSTING) nextStatus = TaskStatus.POSTED;
      break;
    case WorkerEvent.RESULT_OK:
      if (status === TaskStatus.INPROGRESS) nextStatus = TaskStatus.COMPLETED;
      break;
    case WorkerEvent.RESULT_ERR:
      if (
        status === TaskStatus.INPROGRESS ||
        status === TaskStatus.POSTING ||
        status === TaskStatus.POSTED ||
        status === TaskStatus.COMPLETED_WITH_ERRORS
      ) {
        nextStatus = TaskStatus.COMPLETED_WITH_ERRORS;
      }
      break;
    case WorkerEvent.REQUEUE:
      if (status !== TaskStatus.COMPLETED) nextStatus = TaskStatus.WAITING;
      break;
    case WorkerEvent.JOB_PAUSED:
      if (status === TaskStatus.POSTED || status === TaskStatus.INPROGRESS) {
        nextStatus = TaskStatus.POSTED;
      }
      break;
    case WorkerEvent.JOB_DELIVERED: {
      const mapped = taskStatusOfJobStatus(event.jobStatus);
      if (!mapped.ok) return mapped;
      if (status !== TaskStatus.COMPLETED) nextStatus = mapped.value;
      break;
    }
    case WorkerEvent.POST_TIMEOUT:
      if (status === TaskStatus.POSTING) nextStatus = TaskStatus.COMPLETED_WITH_ERRORS;
      break;
  }

  return nextStatus === undefined
    ? FunctionResult.err(new StatusChangeError({ status, event: event.type, workerId, taskId }))
    : FunctionResult.ok(nextStatus);
}

export function workerStatusOf(queue: Task[]): WorkerStatus {
  if (queue.every((task) => task.status === TaskStatus.COMPLETED)) {
    return WorkerStatus.COMPLETED;
  }

  const hasError = queue.some((task) => task.status === TaskStatus.COMPLETED_WITH_ERRORS);
  if (queue.every((task) => isTaskTerminal(task.status))) {
    return WorkerStatus.COMPLETED_WITH_ERRORS;
  }

  return hasError ? WorkerStatus.INPROGRESS_WITH_ERRORS : WorkerStatus.INPROGRESS;
}

export function recoveredOf(worker: Worker): WorkerStatus {
  if (!isWorkerInProgress(worker.status)) return worker.status;

  const hasErrors =
    worker.status === WorkerStatus.INPROGRESS_WITH_ERRORS ||
    worker.queue.some((task) => task.status === TaskStatus.COMPLETED_WITH_ERRORS);
  return hasErrors ? WorkerStatus.UNFINISHED_WITH_ERRORS : WorkerStatus.UNFINISHED;
}

export function transitionWorkerStatus(
  worker: Worker,
  event: WorkerLifecycleEvent,
): FunctionResult<WorkerStatus, StatusChangeError> {
  if (event.type === WorkerEvent.INTERRUPT && isWorkerInProgress(worker.status)) {
    return FunctionResult.ok(recoveredOf(worker));
  }
  if (event.type === WorkerEvent.REQUEUE && canRecoverWorker(worker.status)) {
    const allTasksCompleted = worker.queue.every((task) => task.status === TaskStatus.COMPLETED);
    return FunctionResult.ok(allTasksCompleted ? WorkerStatus.COMPLETED : WorkerStatus.INPROGRESS);
  }
  return FunctionResult.err(
    new StatusChangeError({ status: worker.status, event: event.type, workerId: worker.id }),
  );
}
