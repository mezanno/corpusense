import { getAnnotationText, isAnnotationArray } from '@/data/models/Annotation';
import { Result, ResultCreateDTO } from '@/data/models/Result';
import { isAnnotationScope, isCanvasScope, isCollectionScope, toString } from '@/data/models/Scope';
import {
  isWorker,
  Task,
  Worker,
  WorkerCreateDTO,
  WorkerResponse,
  WorkerStatus,
} from '@/data/models/Worker';
import {
  getCollectionRepository,
  getResultRepository,
  getWorkerRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import i18n from '@/i18n';
import { getErrorMessage } from '@/utils/utils';
import { Canvas } from '@iiif/presentation-3';
import { PayloadAction } from '@reduxjs/toolkit';
import { Task as TaskSaga } from 'redux-saga';
import {
  call,
  cancel,
  cancelled,
  Effect,
  fork,
  put,
  race,
  take,
  takeEvery,
} from 'redux-saga/effects';
import { pushError, pushInfo } from '../reducers/events';
import {
  recoverWorkerRequest,
  setPlugins,
  StartWorkerProcessPayload,
  startWorkerProcessRequest,
  stopWorkerProcessRequest,
} from '../reducers/workers';
import { loadWorkerPlugins, WorkerPlugin } from './plugins/loader';

export const workerPlugins: Record<string, WorkerPlugin> = loadWorkerPlugins();

function* handleStartWorkerProcess(action: PayloadAction<StartWorkerProcessPayload>) {
  const { workerName, params, scope, batchMode } = action.payload;
  if (workerPlugins[workerName] === undefined) {
    console.warn(`No plugin saga found for ${workerName}`);
    //TODO! afficher message d'erreur dans l'UI
    return;
  }

  //when starting a new worker, we create a new WorkerCreateDTO
  const worker = {
    name: workerName,
    scope,
    params,
    batchMode,
  };
  yield call(forkStartWorker, worker);
}

function* handleRecoverWorker(action: PayloadAction<Worker>) {
  const worker = action.payload;
  yield call(forkStartWorker, worker);
}

type WorkerForkRaceResult = { stopped?: unknown; completed?: unknown };
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
    stopped: take(stopWorkerProcessRequest.type),
    // completed: take(processSuccess.type),
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
function* startWorker(
  worker: Worker | WorkerCreateDTO,
): Generator<Effect, void, WorkerResponse | Worker | undefined | Canvas[] | Result> {
  const workerRepository = getWorkerRepository();
  let currentWorker: Worker | undefined = undefined;
  let task: Task | undefined = undefined;
  let idTask = 0;
  try {
    //try...finally used to finish the worker process if it is stopped (cancelled)

    const saga = workerPlugins[worker.name];

    if (isWorker(worker)) {
      //if worker is already a Worker instance, it means it is being recovered
      currentWorker = worker;
      //we update the status according to the current status
      switch (currentWorker.status) {
        case WorkerStatus.UNFINISHED:
          currentWorker = { ...currentWorker, status: WorkerStatus.INPROGRESS };
          break;
        case WorkerStatus.UNFINISHED_WITH_ERRORS:
        case WorkerStatus.COMPLETED_WITH_ERRORS:
          currentWorker = { ...currentWorker, status: WorkerStatus.INPROGRESS_WITH_ERRORS };
          break;
      }
      yield call([workerRepository, workerRepository.patch], currentWorker.id, {
        status: currentWorker.status,
      });
    } else {
      //else, if it's a WorkerCreateDTO, we need to create a new worker
      //but we delete previous worker with same name and same scope if it exists
      const existingWorker = (yield call(
        [workerRepository, workerRepository.getByNameAndScope],
        worker.name,
        worker.scope,
      )) as Worker | undefined;
      if (existingWorker !== undefined) {
        yield call([workerRepository, workerRepository.deleteById], existingWorker.id);
      }
      //then, create a new worker
      currentWorker = (yield call([workerRepository, workerRepository.add], worker)) as Worker;

      const collectionRepository = getCollectionRepository();

      //initialize the worker queue if the scope is collection
      currentWorker.queue = [];
      if (isAnnotationScope(worker.scope) || isCanvasScope(worker.scope)) {
        //add the canvas to the worker queue
        currentWorker.queue.push({
          id: 0,
          scope: worker.scope,
          status: WorkerStatus.WAITING,
        });
      } else if (isCollectionScope(worker.scope)) {
        const collectionId = worker.scope.collectionId;
        const canvases = (yield call(
          [collectionRepository, collectionRepository.getCanvasesByCollectionId],
          collectionId,
        )) as Canvas[];
        //if the collection has no canvases, we set the worker status to ERROR and stop the saga
        if (canvases === undefined || canvases.length === 0) {
          currentWorker.status = WorkerStatus.ERROR;
          yield call([workerRepository, workerRepository.patch], currentWorker.id, {
            status: WorkerStatus.ERROR,
          });
          yield put(pushError(i18n.t('info_empty_collection')));
          return;
        }
        if (worker.batchMode === true) {
          currentWorker.queue = [
            {
              id: 0,
              scope: worker.scope,
              status: WorkerStatus.WAITING,
            },
          ];
        } else {
          //else, we add the canvases to the worker queue
          currentWorker.queue = canvases.map((canvas, index) => ({
            id: index,
            scope: { collectionId: collectionId, canvasId: canvas.id },
            status: WorkerStatus.WAITING,
          }));
        }
        yield call([workerRepository, workerRepository.patch], currentWorker.id, {
          queue: currentWorker.queue,
        });
      }
    }

    //start the saga for each task in the queue
    const resultRepository = getResultRepository();
    let hasError = false;

    while (idTask < currentWorker.queue.length) {
      task = currentWorker.queue[idTask];
      //if the task is already completed, we skip it
      if (task.status === WorkerStatus.COMPLETED) {
        idTask++;
        continue;
      }
      //update the status of the task to INPROGRESS
      task = { ...task, status: WorkerStatus.INPROGRESS };
      currentWorker = {
        ...currentWorker,
        queue: updateTaskStatus(currentWorker.queue, idTask, WorkerStatus.INPROGRESS),
      };

      yield call([workerRepository, workerRepository.patch], currentWorker.id, {
        queue: currentWorker.queue,
      });

      //start the saga for the task
      try {
        const taskResult = (yield call(saga.run, task, currentWorker)) as WorkerResponse;
        switch (taskResult.status) {
          case WorkerStatus.COMPLETED:
            {
              console.log(`Task for scope ${toString(task.scope)} completed successfully`);
              //save the result in the database
              let value: unknown = undefined;
              if (taskResult.content !== undefined) {
                //if the content is an array of annotations, we concatenate the text values
                if (isAnnotationArray(taskResult.content)) {
                  value = taskResult.content.map((a) => getAnnotationText(a)).join('\n');
                } else if (typeof taskResult.content === 'string') {
                  //else, if it's a string, we save it directly
                  value = taskResult.content;
                }
              }
              const result: ResultCreateDTO = {
                scope: task.scope,
                workerName: currentWorker.name,
                workerId: currentWorker.id,
                value,
                taskId: task.id,
                params: worker.params,
              };

              yield call([resultRepository, resultRepository.add], result);
              currentWorker = {
                ...currentWorker,
                queue: updateTaskStatus(currentWorker.queue, idTask, WorkerStatus.COMPLETED, ''), //on ajoute un message vide pour supprimer un potentiel précédent message d'erreur
              };
            }
            break;
          case WorkerStatus.POSTED:
            currentWorker = {
              ...currentWorker,
              queue: updateTaskStatus(currentWorker.queue, idTask, WorkerStatus.POSTED, ''),
            };
            break;
          case WorkerStatus.ERROR:
            console.error(
              `Task for scope ${toString(task.scope)} encountered an error: ${taskResult.statusMessage}`,
            );
            currentWorker = {
              ...currentWorker,
              status: WorkerStatus.INPROGRESS_WITH_ERRORS,
              queue: updateTaskStatus(
                currentWorker.queue,
                idTask,
                WorkerStatus.ERROR,
                taskResult.statusMessage,
              ),
            };
            hasError = true;
            // i++; //needed if we remove the task when it is completed
            break;
          default:
            // i++; //needed if we remove the task when it is completed
            console.warn(`Unknown status for task: ${taskResult.status}`);
        }
        idTask++;
      } catch (error) {
        console.error(`Error in plugin saga for ${worker.name}:`, error);
        currentWorker = {
          ...currentWorker,
          status: WorkerStatus.INPROGRESS_WITH_ERRORS,
          queue: updateTaskStatus(
            currentWorker.queue,
            idTask,
            WorkerStatus.ERROR,
            getErrorMessage(error),
          ),
        };
        hasError = true;
      }

      //update the worker variables at each iteration
      yield call([workerRepository, workerRepository.patch], currentWorker.id, {
        status: currentWorker.status,
        statusMessage: currentWorker.statusMessage,
        queue: currentWorker.queue,
      });
    } //end while loop

    if (hasError) {
      currentWorker = { ...currentWorker, status: WorkerStatus.COMPLETED_WITH_ERRORS };
      yield put(pushError(i18n.t('info_worker_completed_with_error')));
    } else {
      const hasTaskPosted = currentWorker.queue.some((t) => t.status === WorkerStatus.POSTED);
      if (hasTaskPosted) {
        currentWorker = { ...currentWorker, status: WorkerStatus.POSTED };
        yield put(pushInfo(i18n.t('info_worker_all_tasks_posted')));
      } else {
        currentWorker = { ...currentWorker, status: WorkerStatus.COMPLETED };
        yield put(pushInfo(i18n.t('info_worker_completed')));
      }
    }
    yield call([workerRepository, workerRepository.patch], currentWorker.id, {
      status: currentWorker.status,
    });
  } finally {
    if (yield cancelled()) {
      //if the saga is cancelled, we set the worker status to UNFINISHED or UNFINISHED_WITH_ERRORS
      if (currentWorker !== undefined) {
        console.log(`Worker ${worker.name} was cancelled`);
        if (currentWorker.status === WorkerStatus.INPROGRESS) {
          currentWorker = { ...currentWorker, status: WorkerStatus.UNFINISHED };
        } else if (currentWorker.status === WorkerStatus.INPROGRESS_WITH_ERRORS) {
          currentWorker = { ...currentWorker, status: WorkerStatus.UNFINISHED_WITH_ERRORS };
        }

        //if there is a task in progress, we update its status to WAITING
        if (task !== undefined) {
          currentWorker.queue = updateTaskStatus(currentWorker.queue, idTask, WorkerStatus.WAITING);
        }
        yield call([workerRepository, workerRepository.patch], currentWorker.id, {
          status: currentWorker.status,
        });
      }
    }
  }
}

function updateTaskStatus(
  queue: Task[],
  index: number,
  status: WorkerStatus,
  statusMessage?: string,
): Task[] {
  if (statusMessage === undefined) {
    return queue.map((task, i) => (i === index ? { ...task, status } : task));
  } else {
    return queue.map((task, i) => (i === index ? { ...task, status, statusMessage } : task));
  }
}

/**
 * Fetch all workers and their results from the IndexedDB.
 * This function is called when the application starts to load the workers and their results into the Redux store.
 */
//TODO! à conserver pour permettre la mise à jour des workers au démarrage de l'application
function* initWorkersStatus(): Generator<Effect, void, Worker[] | Result[]> {
  const workerRepository = getWorkerRepository();
  const workers = (yield call([workerRepository, workerRepository.getAll])) as Worker[];

  //if there are workers with status INPROGRESS or INPROGRESS_WITH_ERRORS, we set them to UNFINISHED or UNFINISHED_WITH_ERRORS
  for (const worker of workers) {
    if (
      worker.status === WorkerStatus.INPROGRESS ||
      worker.status === WorkerStatus.INPROGRESS_WITH_ERRORS
    ) {
      const newStatus =
        worker.status === WorkerStatus.INPROGRESS
          ? WorkerStatus.UNFINISHED
          : WorkerStatus.UNFINISHED_WITH_ERRORS;
      const newQueue = worker.queue.map((task) => ({
        ...task,
        status: task.status === WorkerStatus.COMPLETED ? task.status : WorkerStatus.WAITING,
      }));
      yield call([workerRepository, workerRepository.patch], worker.id, {
        status: newStatus,
        queue: newQueue,
      });
      worker.status = newStatus;
      worker.queue = newQueue;
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
    batchCompatible: workerPlugins[name].info.batchCompatible,
    configurationParams: workerPlugins[name].info.configurationParams,
  }));
  yield put(setPlugins(pluginsInfo));
}

export default function* workerSaga() {
  yield takeEvery(startWorkerProcessRequest, handleStartWorkerProcess);
  yield takeEvery(recoverWorkerRequest, handleRecoverWorker);
}

export { initWorkersStatus, loadWorkerPluginsInfo };
