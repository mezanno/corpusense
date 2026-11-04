import { getAnnotationText, isAnnotationArray } from '@/data/models/annotations/annotation.utils';
import { ResultCreateDTO } from '@/data/models/result/result.dto';
import {
  isAnnotationScope,
  isCanvasScope,
  isCollectionScope,
  toString,
} from '@/data/models/scope/scope.utils';
import { Task, TaskStatus, Worker, WorkerEvent, WorkerResponse } from '@/data/models/worker/worker';
import { WorkerCreateDTO } from '@/data/models/worker/worker.dto';
import { isWorker } from '@/data/models/worker/worker.utils';
import type { TaskEvent, WorkerLifecycleEvent } from '@/data/models/worker/workerStatusLaw';
import {
  canRecoverWorker,
  hasWorkerErrors,
  isTaskCompleted,
  isTaskJobTracked,
  isTaskPosting,
  isTaskWaiting,
  isWorkerCompleted,
  isWorkerInProgress,
  StatusChangeError,
  taskStatusOfJobStatus,
} from '@/data/models/worker/workerStatusLaw';
import { EntityNotFoundError } from '@/data/repositories/EntityNotFoundError';
import {
  getCollectionRepository,
  getResultRepository,
  getWorkerRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import i18n from '@/i18n';
import { BaseError } from '@/utils/BaseError';
import { JobRow, supabase } from '@/utils/config';
import { FunctionResult } from '@/utils/functionResult';
import { getErrorMessage } from '@/utils/utils';
import { Canvas } from '@iiif/presentation-3';
import { PayloadAction } from '@reduxjs/toolkit';
import { Task as TaskSaga } from 'redux-saga';
import {
  call,
  cancel,
  cancelled,
  delay,
  Effect,
  fork,
  join,
  put,
  race,
  take,
  takeEvery,
} from 'redux-saga/effects';
import { v4 as uuid } from 'uuid';
import { pushError, pushInfo } from '../reducers/events';
import {
  recoverWorkerRequest,
  setPlugins,
  StartWorkerProcessPayload,
  startWorkerProcessRequest,
  stopWorkerProcessRequest,
} from '../reducers/workers';
import { loadWorkerPlugins, WorkerPlugin } from './plugins/loader';

const POST_TIMEOUT_MS = 60000;

export const workerPlugins: Record<string, WorkerPlugin> = loadWorkerPlugins();

async function findJobForTask(workerId: string, taskId: number): Promise<JobRow | undefined> {
  const { data, error } = await supabase
    .from('cs_jobs')
    .select('*')
    .eq('worker_id', workerId)
    .eq('task_id', taskId)
    .maybeSingle();
  if (error) throw error;
  return data ?? undefined;
}

async function resumeJob(jobId: number): Promise<JobRow> {
  const { data, error } = await supabase
    .from('cs_jobs')
    .update({ status: 'pending' })
    .eq('id', jobId)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (data === null) {
    throw new BaseError(`Unable to resume Supabase job ${jobId}`, {
      context: { jobId },
    });
  }
  return data;
}

async function pauseWorkerJobs(workerId: string): Promise<JobRow[]> {
  const { data, error } = await supabase
    .from('cs_jobs')
    .select('*')
    .eq('worker_id', workerId)
    .in('status', ['pending', 'processing']);
  if (error) throw error;

  const pausedJobs: JobRow[] = [];
  for (const job of data ?? []) {
    const { data: pausedJob, error: pauseError } = await supabase
      .from('cs_jobs')
      .update({ status: 'paused' })
      .eq('id', job.id)
      .select('*')
      .maybeSingle();
    if (pauseError) throw pauseError;
    if (pausedJob !== null) pausedJobs.push(pausedJob);
  }
  return pausedJobs;
}

function* applyTaskEvent(
  workerRepository: ReturnType<typeof getWorkerRepository>,
  workerId: string,
  taskId: number,
  event: TaskEvent,
  statusMessage?: string,
): Generator<Effect, Task, unknown> {
  const result = (yield call(
    [workerRepository, workerRepository.updateTaskStatus],
    workerId,
    taskId,
    event,
    statusMessage,
  )) as FunctionResult<Task, EntityNotFoundError | StatusChangeError>;
  if (!result.ok) throw result.error;
  return result.value;
}

function* applyWorkerEvent(
  workerRepository: ReturnType<typeof getWorkerRepository>,
  workerId: string,
  event: WorkerLifecycleEvent,
): Generator<Effect, Worker, unknown> {
  const result = (yield call(
    [workerRepository, workerRepository.updateWorkerStatus],
    workerId,
    event,
  )) as FunctionResult<Worker, EntityNotFoundError | StatusChangeError>;
  if (!result.ok) throw result.error;
  return result.value;
}

function* handleStartWorkerProcess(action: PayloadAction<StartWorkerProcessPayload>) {
  const { workerName, params, scope } = action.payload;
  if (workerPlugins[workerName] === undefined) {
    console.warn(`No plugin saga found for ${workerName}`);
    //TODO! afficher message d'erreur dans l'UI
    return;
  }

  //when starting a new worker, we create a new WorkerCreateDTO
  const worker = {
    id: uuid(),
    name: workerName,
    scope,
    params,
  };
  yield call(forkStartWorker, worker);
}

function* handleRecoverWorker(action: PayloadAction<Worker>) {
  const worker = action.payload;
  yield call(forkStartWorker, worker);
}
type WorkerForkRaceResult = { stopped?: unknown; completed?: unknown };

const isStopWorkerAction = (action: unknown): action is PayloadAction<Worker> => {
  return (
    typeof action === 'object' &&
    action !== null &&
    'type' in action &&
    action.type === stopWorkerProcessRequest.type &&
    'payload' in action &&
    typeof action.payload === 'object' &&
    action.payload !== null &&
    'id' in action.payload &&
    typeof action.payload.id === 'string'
  );
};
/**
 * This function is used to fork the startWorker saga.
 * It is used to start a worker process in the background.
 * It allows the worker to run independently of the main saga flow.
 * @param worker Worker or WorkerCreateDTO
 */
function* forkStartWorker(worker: Worker | WorkerCreateDTO): Generator<Effect, void, unknown> {
  console.log(`Starting worker: ${worker.name} with scope: ${toString(worker.scope)}`);
  const task: TaskSaga = (yield fork(startWorker, worker)) as TaskSaga;
  const result = (yield race({
    stopped: take(
      (action: unknown) => isStopWorkerAction(action) && action.payload.id === worker.id,
    ),
    completed: join(task),
  })) as WorkerForkRaceResult;
  console.log(`Worker ${worker.name} finished with result:`, result);
  if ('stopped' in result) {
    console.log(`Worker ${worker.name} was stopped`);

    yield cancel(task);
  }
}

/**
 *
 * @param worker Worker or WorkerCreateDTOr'
 */
function* startWorker(workerInput: Worker | WorkerCreateDTO): Generator<Effect, void, unknown> {
  const workerRepository = getWorkerRepository();
  let currentWorker: Worker | undefined = undefined;
  let task: Task | undefined = undefined;
  try {
    const plugin = workerPlugins[workerInput.name];
    if (plugin === undefined) {
      console.error(`No plugin saga found for ${workerInput.name}`);
      return;
    }

    const tasksWithExistingJobs = new Set<number>();
    if (isWorker(workerInput)) {
      const stored = (yield call(
        [workerRepository, workerRepository.getById],
        workerInput.id,
      )) as FunctionResult<Worker, EntityNotFoundError>;
      if (!stored.ok) {
        console.error('Unable to load worker for relaunch:', stored.error);
        return;
      }

      currentWorker = stored.value;
      if (!canRecoverWorker(currentWorker.status)) {
        console.warn(`Worker ${currentWorker.id} is not in a recoverable status`);
        return;
      }
      currentWorker = yield* applyWorkerEvent(workerRepository, currentWorker.id, {
        type: WorkerEvent.REQUEUE,
      });

      for (const queuedTask of currentWorker.queue) {
        if (isTaskCompleted(queuedTask.status)) continue;

        if (plugin.executionStrategy === 'job') {
          let job = (yield call(findJobForTask, currentWorker.id, queuedTask.id)) as
            | JobRow
            | undefined;
          if (job !== undefined) {
            if (job.status === 'paused') {
              job = (yield call(resumeJob, job.id)) as JobRow;
            }
            tasksWithExistingJobs.add(queuedTask.id);
            if (job.status !== 'completed' && job.status !== 'failed') {
              const mappedStatus = taskStatusOfJobStatus(job.status);
              if (!mappedStatus.ok) throw mappedStatus.error;
              yield* applyTaskEvent(workerRepository, currentWorker.id, queuedTask.id, {
                type: WorkerEvent.JOB_DELIVERED,
                jobStatus: job.status,
              });
            }
            continue;
          }
        }

        if (!isTaskWaiting(queuedTask.status)) {
          yield* applyTaskEvent(workerRepository, currentWorker.id, queuedTask.id, {
            type: WorkerEvent.REQUEUE,
          });
        }
      }
    } else {
      let queue: Task[] = [];
      if (isAnnotationScope(workerInput.scope) || isCanvasScope(workerInput.scope)) {
        queue = [{ id: 0, scope: workerInput.scope, status: TaskStatus.WAITING }];
      } else if (isCollectionScope(workerInput.scope)) {
        const collectionId = workerInput.scope.collectionId;
        const collectionRepository = getCollectionRepository();
        const canvasesResult = (yield call(
          [collectionRepository, collectionRepository.getCanvasesByCollectionId],
          collectionId,
        )) as FunctionResult<Canvas[], EntityNotFoundError>;
        if (!canvasesResult.ok || canvasesResult.value.length === 0) {
          yield put(pushError(i18n.t('info_empty_collection')));
          return;
        }
        queue = canvasesResult.value.map((canvas, index) => ({
          id: index,
          scope: { collectionId, canvasId: canvas.id },
          status: TaskStatus.WAITING,
          previousTask:
            index > 0
              ? {
                  workerId: workerInput.id,
                  taskId: index - 1,
                }
              : undefined,
        }));
      }

      currentWorker = (yield call(
        [workerRepository, workerRepository.add],
        workerInput,
        queue,
      )) as Worker;
    }

    const resultRepository = getResultRepository();
    let averageTaskDuration = 0;
    let totalTasksDone = 0;

    for (let taskIndex = 0; taskIndex < currentWorker.queue.length; taskIndex++) {
      const freshWorker = (yield call(
        [workerRepository, workerRepository.getById],
        currentWorker.id,
      )) as FunctionResult<Worker, EntityNotFoundError>;
      if (!freshWorker.ok) throw freshWorker.error;
      currentWorker = freshWorker.value;

      task = currentWorker.queue[taskIndex];
      if (task === undefined || isTaskCompleted(task.status)) continue;
      if (tasksWithExistingJobs.has(task.id)) continue;
      const taskStartTime = Date.now();

      const initialEvent =
        plugin.executionStrategy === 'job' ? WorkerEvent.POST : WorkerEvent.START;
      task = yield* applyTaskEvent(workerRepository, currentWorker.id, task.id, {
        type: initialEvent,
      });

      let taskResult: WorkerResponse;
      try {
        if (plugin.executionStrategy === 'job') {
          const outcome = (yield race({
            response: call(plugin.run, task, currentWorker),
            timedOut: delay(POST_TIMEOUT_MS),
          })) as { response?: WorkerResponse; timedOut?: unknown };
          if ('timedOut' in outcome) {
            yield* applyTaskEvent(
              workerRepository,
              currentWorker.id,
              task.id,
              {
                type: WorkerEvent.POST_TIMEOUT,
              },
              'Job post timed out after 60 seconds',
            );
            continue;
          }
          if (outcome.response === undefined) {
            throw new BaseError('Job plugin completed without a response', {
              context: { workerId: currentWorker.id, taskId: task.id },
            });
          }
          taskResult = outcome.response;
        } else {
          taskResult = (yield call(plugin.run, task, currentWorker)) as WorkerResponse;
        }
      } catch (error) {
        taskResult = {
          event: WorkerEvent.RESULT_ERR,
          message: getErrorMessage(error),
        };
      }

      let taskEvent: TaskEvent;
      let statusMessage = taskResult.message;
      if (
        taskResult.event === WorkerEvent.RESULT_OK &&
        plugin.executionStrategy === 'synchronous'
      ) {
        try {
          let value: unknown;
          if (taskResult.content !== undefined) {
            if (isAnnotationArray(taskResult.content)) {
              value = taskResult.content
                .map((annotation) => getAnnotationText(annotation))
                .join('\n');
            } else if (typeof taskResult.content === 'string') {
              value = taskResult.content;
            }
          }
          const result: ResultCreateDTO = {
            scope: task.scope,
            workerName: currentWorker.name,
            workerCategory: plugin.info.category,
            workerId: currentWorker.id,
            value,
            taskId: task.id,
            params: currentWorker.params,
          };
          yield call([resultRepository, resultRepository.add], result);
          taskEvent = { type: WorkerEvent.RESULT_OK };
          statusMessage = undefined;
        } catch (error) {
          taskEvent = { type: WorkerEvent.RESULT_ERR };
          statusMessage = getErrorMessage(error);
        }
      } else if (
        taskResult.event === WorkerEvent.JOB_ACCEPTED &&
        plugin.executionStrategy === 'job'
      ) {
        taskEvent = { type: WorkerEvent.JOB_ACCEPTED };
      } else {
        taskEvent = { type: WorkerEvent.RESULT_ERR };
        if (taskResult.event !== WorkerEvent.RESULT_ERR) {
          statusMessage = 'Plugin returned an event that does not match its execution strategy';
        }
      }

      yield* applyTaskEvent(workerRepository, currentWorker.id, task.id, taskEvent, statusMessage);

      const taskDuration = Date.now() - taskStartTime;
      averageTaskDuration =
        totalTasksDone === 0 ? taskDuration : 0.2 * taskDuration + 0.8 * averageTaskDuration;
      const remainingTaskCount = currentWorker.queue.length - taskIndex - 1;
      const estimatedDuration = averageTaskDuration * remainingTaskCount;
      yield call([workerRepository, workerRepository.patch], currentWorker.id, {
        estimatedDuration,
      });
      totalTasksDone++;
    }

    const finalWorker = (yield call(
      [workerRepository, workerRepository.getById],
      currentWorker.id,
    )) as FunctionResult<Worker, EntityNotFoundError>;
    if (!finalWorker.ok) throw finalWorker.error;
    currentWorker = finalWorker.value;

    if (isWorkerCompleted(currentWorker.status) && hasWorkerErrors(currentWorker.status)) {
      yield put(pushError(i18n.t('info_worker_completed_with_error')));
    } else if (isWorkerCompleted(currentWorker.status)) {
      yield put(pushInfo(i18n.t('info_worker_completed')));
    } else if (currentWorker.queue.some((queuedTask) => isTaskJobTracked(queuedTask.status))) {
      yield put(pushInfo(i18n.t('info_worker_all_tasks_posted')));
    }
  } catch (error) {
    console.error(`Error running worker ${workerInput.name}:`, error);
    yield put(pushError(getErrorMessage(error)));
    if (currentWorker !== undefined) {
      try {
        const latest = (yield call(
          [workerRepository, workerRepository.getById],
          currentWorker.id,
        )) as FunctionResult<Worker, EntityNotFoundError>;
        if (latest.ok && isWorkerInProgress(latest.value.status)) {
          yield* applyWorkerEvent(workerRepository, currentWorker.id, {
            type: WorkerEvent.INTERRUPT,
          });
        }
      } catch (recoveryError) {
        console.error(`Unable to recover worker ${currentWorker.id} after failure:`, recoveryError);
      }
    }
  } finally {
    if ((yield cancelled()) === true) {
      if (currentWorker !== undefined) {
        console.log(`Worker ${currentWorker.name} was cancelled`);
        try {
          currentWorker = yield* applyWorkerEvent(workerRepository, currentWorker.id, {
            type: WorkerEvent.INTERRUPT,
          });
          const pausedJobs = (yield call(pauseWorkerJobs, currentWorker.id)) as JobRow[];
          for (const job of pausedJobs) {
            const latest = (yield call(
              [workerRepository, workerRepository.getById],
              currentWorker.id,
            )) as FunctionResult<Worker, EntityNotFoundError>;
            if (!latest.ok) {
              console.error(
                `Unable to load worker ${currentWorker.id} while pausing job ${job.id}:`,
                latest.error,
              );
              continue;
            }
            const pausedTask = latest.value.queue.find(
              (queuedTask) => queuedTask.id === job.task_id,
            );
            if (pausedTask === undefined) continue;

            if (isTaskPosting(pausedTask.status)) {
              yield* applyTaskEvent(workerRepository, currentWorker.id, pausedTask.id, {
                type: WorkerEvent.JOB_ACCEPTED,
              });
            }
            yield* applyTaskEvent(workerRepository, currentWorker.id, pausedTask.id, {
              type: WorkerEvent.JOB_PAUSED,
            });
          }
        } catch (error) {
          console.error(`Unable to persist interruption of worker ${currentWorker.id}:`, error);
        }
      }
    }
  }
}

/**
 * Fetch all workers and their results from the IndexedDB.
 * This function is called when the application starts to load the workers and their results into the Redux store.
 */
//TODO! à conserver pour permettre la mise à jour des workers au démarrage de l'application
function* initWorkersStatus(): Generator<Effect, void, unknown> {
  const workerRepository = getWorkerRepository();
  const workers = (yield call([workerRepository, workerRepository.getAll])) as Worker[];

  for (const worker of workers) {
    if (isWorkerInProgress(worker.status)) {
      try {
        yield* applyWorkerEvent(workerRepository, worker.id, {
          type: WorkerEvent.INTERRUPT,
        });
      } catch (error) {
        console.error(`Unable to recover worker ${worker.id} at startup:`, error);
      }
    }
  }
}

function* loadWorkerPluginsInfo(): Generator<Effect, void, { name: string; hasExport: boolean }[]> {
  const pluginsInfo = Object.keys(workerPlugins).map((name) => ({
    name,
    hasExport: workerPlugins[name].export !== undefined,
    displayName: workerPlugins[name].info.displayName,
    description: workerPlugins[name].info.description,
    category: workerPlugins[name].info.category,
    exportFormats: workerPlugins[name].info.exportFormats,
    configurationParams: workerPlugins[name].info.configurationParams,
  }));
  yield put(setPlugins(pluginsInfo));
}

export default function* workerSaga() {
  yield takeEvery(startWorkerProcessRequest, handleStartWorkerProcess);
  yield takeEvery(recoverWorkerRequest, handleRecoverWorker);
}

export { initWorkersStatus, loadWorkerPluginsInfo };
