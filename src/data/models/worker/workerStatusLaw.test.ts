import { FunctionResult } from '@/utils/functionResult';
import { describe, expect, it } from 'vitest';
import type { Task, Worker } from './worker';
import type { TaskEvent } from './workerStatusLaw';
import {
  isTaskTerminal,
  isWorkerInProgress,
  recoveredOf,
  StatusChangeError,
  TaskStatus,
  taskStatusOfJobStatus,
  transitionTaskStatus,
  transitionWorkerStatus,
  WorkerEvent,
  WorkerStatus,
  workerStatusOf,
} from './workerStatusLaw';

const task = (status: TaskStatus): Task => ({
  id: 0,
  scope: { collectionId: 'collection-1', canvasId: 'canvas-1' },
  status,
});

const worker = (status: WorkerStatus, queue: Task[] = []): Worker => ({
  id: 'worker-1',
  name: 'test-worker',
  scope: { collectionId: 'collection-1' },
  params: {},
  scopeKey: 'collection-1',
  status,
  createdAt: '2026-01-01T00:00:00.000Z',
  estimatedDuration: 0,
  queue,
});

describe('worker status law', () => {
  const taskEvents: TaskEvent[] = [
    { type: WorkerEvent.START },
    { type: WorkerEvent.POST },
    { type: WorkerEvent.JOB_ACCEPTED },
    { type: WorkerEvent.RESULT_OK },
    { type: WorkerEvent.RESULT_ERR },
    { type: WorkerEvent.REQUEUE },
    { type: WorkerEvent.JOB_PAUSED },
    { type: WorkerEvent.POST_TIMEOUT },
    ...(['pending', 'processing', 'completed', 'failed', 'paused'] as const).map(
      (jobStatus): TaskEvent => ({
        type: WorkerEvent.JOB_DELIVERED,
        jobStatus,
      }),
    ),
  ];

  const expectedTransitions: Record<TaskStatus, Partial<Record<string, TaskStatus>>> = {
    [TaskStatus.WAITING]: {
      [WorkerEvent.START]: TaskStatus.INPROGRESS,
      [WorkerEvent.POST]: TaskStatus.POSTING,
      [WorkerEvent.REQUEUE]: TaskStatus.WAITING,
      'JOB_DELIVERED:pending': TaskStatus.POSTED,
      'JOB_DELIVERED:processing': TaskStatus.INPROGRESS,
      'JOB_DELIVERED:completed': TaskStatus.COMPLETED,
      'JOB_DELIVERED:failed': TaskStatus.COMPLETED_WITH_ERRORS,
      'JOB_DELIVERED:paused': TaskStatus.POSTED,
    },
    [TaskStatus.POSTING]: {
      [WorkerEvent.JOB_ACCEPTED]: TaskStatus.POSTED,
      [WorkerEvent.RESULT_ERR]: TaskStatus.COMPLETED_WITH_ERRORS,
      [WorkerEvent.REQUEUE]: TaskStatus.WAITING,
      [WorkerEvent.POST_TIMEOUT]: TaskStatus.COMPLETED_WITH_ERRORS,
      'JOB_DELIVERED:pending': TaskStatus.POSTED,
      'JOB_DELIVERED:processing': TaskStatus.INPROGRESS,
      'JOB_DELIVERED:completed': TaskStatus.COMPLETED,
      'JOB_DELIVERED:failed': TaskStatus.COMPLETED_WITH_ERRORS,
      'JOB_DELIVERED:paused': TaskStatus.POSTED,
    },
    [TaskStatus.POSTED]: {
      [WorkerEvent.RESULT_ERR]: TaskStatus.COMPLETED_WITH_ERRORS,
      [WorkerEvent.REQUEUE]: TaskStatus.WAITING,
      [WorkerEvent.JOB_PAUSED]: TaskStatus.POSTED,
      'JOB_DELIVERED:pending': TaskStatus.POSTED,
      'JOB_DELIVERED:processing': TaskStatus.INPROGRESS,
      'JOB_DELIVERED:completed': TaskStatus.COMPLETED,
      'JOB_DELIVERED:failed': TaskStatus.COMPLETED_WITH_ERRORS,
      'JOB_DELIVERED:paused': TaskStatus.POSTED,
    },
    [TaskStatus.INPROGRESS]: {
      [WorkerEvent.RESULT_OK]: TaskStatus.COMPLETED,
      [WorkerEvent.RESULT_ERR]: TaskStatus.COMPLETED_WITH_ERRORS,
      [WorkerEvent.REQUEUE]: TaskStatus.WAITING,
      [WorkerEvent.JOB_PAUSED]: TaskStatus.POSTED,
      'JOB_DELIVERED:pending': TaskStatus.POSTED,
      'JOB_DELIVERED:processing': TaskStatus.INPROGRESS,
      'JOB_DELIVERED:completed': TaskStatus.COMPLETED,
      'JOB_DELIVERED:failed': TaskStatus.COMPLETED_WITH_ERRORS,
      'JOB_DELIVERED:paused': TaskStatus.POSTED,
    },
    [TaskStatus.COMPLETED]: {},
    [TaskStatus.COMPLETED_WITH_ERRORS]: {
      [WorkerEvent.RESULT_ERR]: TaskStatus.COMPLETED_WITH_ERRORS,
      [WorkerEvent.REQUEUE]: TaskStatus.WAITING,
      'JOB_DELIVERED:pending': TaskStatus.POSTED,
      'JOB_DELIVERED:processing': TaskStatus.INPROGRESS,
      'JOB_DELIVERED:completed': TaskStatus.COMPLETED,
      'JOB_DELIVERED:failed': TaskStatus.COMPLETED_WITH_ERRORS,
      'JOB_DELIVERED:paused': TaskStatus.POSTED,
    },
  };

  it('matches the exhaustive task transition table', () => {
    for (const status of Object.values(TaskStatus)) {
      for (const event of taskEvents) {
        const key =
          event.type === WorkerEvent.JOB_DELIVERED
            ? `${event.type}:${event.jobStatus}`
            : event.type;
        const expected = expectedTransitions[status][key];
        const result = transitionTaskStatus(status, event);

        if (expected === undefined) {
          expect(result.ok, `${status} on ${key}`).toBe(false);
          expect(result.ok === false && result.error).toBeInstanceOf(StatusChangeError);
        } else {
          expect(result, `${status} on ${key}`).toEqual(FunctionResult.ok(expected));
        }
      }
    }
  });

  it('returns a typed error for an invalid transition and an unknown job status', () => {
    const invalidTransition = transitionTaskStatus(TaskStatus.COMPLETED, {
      type: WorkerEvent.RESULT_ERR,
    });
    const unknownStatus = taskStatusOfJobStatus('cancelled');

    expect(invalidTransition.ok).toBe(false);
    expect(unknownStatus.ok).toBe(false);
    expect(isTaskTerminal(TaskStatus.COMPLETED_WITH_ERRORS)).toBe(true);
  });

  it.each([
    ['pending', TaskStatus.POSTED],
    ['processing', TaskStatus.INPROGRESS],
    ['completed', TaskStatus.COMPLETED],
    ['failed', TaskStatus.COMPLETED_WITH_ERRORS],
    ['paused', TaskStatus.POSTED],
  ])('maps the Supabase status %s', (jobStatus, expected) => {
    expect(taskStatusOfJobStatus(jobStatus)).toEqual(FunctionResult.ok(expected));
  });

  it('derives terminal and in-progress worker states from its queue', () => {
    expect(workerStatusOf([task(TaskStatus.COMPLETED)])).toBe(WorkerStatus.COMPLETED);
    expect(
      workerStatusOf([task(TaskStatus.COMPLETED), task(TaskStatus.COMPLETED_WITH_ERRORS)]),
    ).toBe(WorkerStatus.COMPLETED_WITH_ERRORS);
    expect(workerStatusOf([task(TaskStatus.COMPLETED_WITH_ERRORS), task(TaskStatus.WAITING)])).toBe(
      WorkerStatus.INPROGRESS_WITH_ERRORS,
    );
    expect(isWorkerInProgress(workerStatusOf([task(TaskStatus.POSTED)]))).toBe(true);
  });

  it('marks an active worker unfinished and preserves an already unfinished worker', () => {
    expect(recoveredOf(worker(WorkerStatus.INPROGRESS, [task(TaskStatus.INPROGRESS)]))).toBe(
      WorkerStatus.UNFINISHED,
    );
    expect(
      recoveredOf(worker(WorkerStatus.INPROGRESS, [task(TaskStatus.COMPLETED_WITH_ERRORS)])),
    ).toBe(WorkerStatus.UNFINISHED_WITH_ERRORS);
    expect(recoveredOf(worker(WorkerStatus.UNFINISHED, [task(TaskStatus.COMPLETED)]))).toBe(
      WorkerStatus.UNFINISHED,
    );
  });

  it('closes an already-completed queue on relaunch but restarts errored tasks cleanly', () => {
    expect(
      transitionWorkerStatus(worker(WorkerStatus.UNFINISHED, [task(TaskStatus.COMPLETED)]), {
        type: WorkerEvent.REQUEUE,
      }),
    ).toEqual(FunctionResult.ok(WorkerStatus.COMPLETED));
    expect(
      transitionWorkerStatus(
        worker(WorkerStatus.COMPLETED_WITH_ERRORS, [task(TaskStatus.COMPLETED_WITH_ERRORS)]),
        { type: WorkerEvent.REQUEUE },
      ),
    ).toEqual(FunctionResult.ok(WorkerStatus.INPROGRESS));
    expect(
      transitionWorkerStatus(worker(WorkerStatus.UNFINISHED), {
        type: WorkerEvent.REQUEUE,
      }),
    ).toEqual(FunctionResult.ok(WorkerStatus.COMPLETED));
  });
});
