import { Collection } from '@/data/models/Collection';
import { convertEdwinResult, EdwinBox } from '@/data/models/converters/edwinMagic';
import { Result, ResultCreateDTO } from '@/data/models/Result';
import { isCanvasScope, isCollectionScope, toString } from '@/data/models/Scope';
import {
  isWorker,
  Task,
  Worker,
  WorkerCreateDTO,
  WorkerResponse,
  WorkerStatus,
} from '@/data/models/Worker';
import {
  getAnnotationRepository,
  getCollectionRepository,
  getResultRepository,
  getWorkerRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { getImage } from '@/data/utils/canvas';
import i18n from '@/i18n';
import { getErrorMessage } from '@/utils/utils';
import { Canvas } from '@iiif/presentation-3';
import { PayloadAction } from '@reduxjs/toolkit';
import { Task as TaskSaga } from 'redux-saga';
import {
  call,
  CallEffect,
  cancel,
  cancelled,
  Effect,
  fork,
  put,
  PutEffect,
  race,
  take,
  takeEvery,
  takeLatest,
} from 'redux-saga/effects';
import { fetchAnnotationsSuccess } from '../reducers/annotations';
import { pushError, pushInfo } from '../reducers/events';
import {
  addResult,
  ExportWorkerPayload,
  exportWorkerResultRequest,
  fetchBatchLayoutRequest,
  fetchLayoutPayload,
  fetchLayoutRequest,
  processError,
  processRunning,
  processStart,
  processSuccess,
  recoverWorkerRequest,
  removeWorkerRequest,
  setResults,
  setWorkers,
  startWorkerProcess,
  StartWorkerProcessPayload,
  stopWorkerProcessRequest,
  updateWorker,
} from '../reducers/workers';
import { loadWorkerPlugins, WorkerPlugin } from './plugins/loader';

const workerPlugins: Record<string, WorkerPlugin> = loadWorkerPlugins();

function* handleFetchLayout({
  canvas,
  collectionId,
  originalWidth,
}: fetchLayoutPayload): Generator<CallEffect | PutEffect, void, Response> {
  yield put(pushInfo(i18n.t('info_start_layout', { canvas })));
  try {
    if (canvas === undefined) {
      // yield put(processError({ url: canvas.id, error: 'Canvas or region is undefined' }));
      return;
    }

    yield put(processRunning({ collectionId, canvasId: canvas.id }));
    const image = getImage(canvas);

    const response: Response = yield call(
      fetch,
      // `http://localhost:3000/layout?image_url=${imageUrl}`,
      `https://api.mezanno.xyz/layout?image_url=${image.id}`,
    );
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = yield call([response, 'json']);
    console.log('data: ', data);
    //convert the result into an array of Annotation
    const annotations = convertEdwinResult(
      data as unknown as EdwinBox[],
      canvas.id,
      collectionId,
      originalWidth,
    );
    //and send it to the redux store
    yield put(fetchAnnotationsSuccess(annotations));
    const annotationRepository = getAnnotationRepository();
    yield call([annotationRepository, annotationRepository.saveAllAnnotations], annotations);
    yield put(processSuccess({ collectionId, canvasId: canvas.id }));
  } catch (error) {
    console.error('Error fetching layout:', error);
    yield put(processError({ collectionId, canvasId: canvas.id }));
  }
}

// function* handleFetchOcr({
//   canvas,
//   collectionId,
//   region,
// }: fetchOcrPayload): Generator<
//   CallEffect | PutEffect,
//   void,
//   Client | PredictReturn | Annotation[]
// > {
//   yield put(pushInfo(i18n.t('info_start_ocr', { canvas })));
//   if (canvas === undefined) {
//     // yield put(processError({ url: canvas.id, error: 'Canvas or region is undefined' }));
//     return;
//   }
//   // Check if the canvas has already been processed
//   const annotationRepository = getAnnotationRepository();
//   const existingAnnotations = (yield call(
//     [annotationRepository, annotationRepository.getAnnotationsForCanvasByType],
//     canvas.id,
//     collectionId,
//     ElementType.LINE,
//   )) as Annotation[];
//   if (existingAnnotations.length > 0) {
//     console.log('Canvas already processed for OCR, skipping:', canvas.id);
//     yield put(processSuccess({ collectionId, canvasId: canvas.id }));
//     return;
//   }
//   yield put(processRunning({ collectionId, canvasId: canvas.id }));

//   try {
//     const image = getImage(canvas);

//     let regions = JSON.stringify([]);
//     if (region === undefined || region === null) {
//       const annotations = (yield call(
//         [annotationRepository, annotationRepository.getAnnotationsForCanvas],
//         canvas.id,
//         collectionId,
//       )) as Annotation[];
//       const annotationRegions = annotations.filter(
//         (a) => getAnnotationType(a) === ElementType.REGION,
//       );
//       if (annotationRegions.length > 0) {
//         regions = JSON.stringify(
//           annotationRegions
//             .sort((a1, a2) => (a1.order ?? 0) - (a2.order ?? 0))
//             .map((annotation) => {
//               return {
//                 xtl: annotation.target.selector.geometry.bounds.minX,
//                 ytl: annotation.target.selector.geometry.bounds.minY,
//                 xbr: annotation.target.selector.geometry.bounds.maxX,
//                 ybr: annotation.target.selector.geometry.bounds.maxY,
//               };
//             }),
//         );
//       }
//     } else {
//       regions = JSON.stringify([
//         {
//           xtl: region?.left,
//           ytl: region?.top,
//           xbr: region?.left + region?.width,
//           ybr: region?.top + region?.height,
//         },
//       ]);
//     }

//     const client = (yield call(() => Client.connect('https://api.mezanno.xyz/ocr/'))) as Client;
//     const gradioResult = (yield call(() =>
//       client.predict('/transcribe', { image_url: image.id, regions }),
//     )) as PredictReturn;

//     console.log(gradioResult.data);
//     try {
//       const peroResult = peroResultSchema.parse(gradioResult.data);
//       const annotations = convertPeroTranscriptionsToAnnotations(
//         peroResult,
//         canvas.id,
//         collectionId,
//       );
//       yield put(fetchAnnotationsSuccess(annotations));
//       yield call([annotationRepository, annotationRepository.saveAllAnnotations], annotations);
//       yield put(processSuccess({ collectionId, canvasId: canvas.id }));
//     } catch (error) {
//       try {
//         const peroError = peroResultError.parse(gradioResult.data);
//         console.error('peroError: ', peroError[0].result.error);
//         // yield put(processError({ id: canvas.id, error: peroError[0].result.error }));
//         yield put(processError({ collectionId, canvasId: canvas.id }));
//       } catch (err) {
//         console.error('Error parsing peroResult:', err);
//         // yield put(processError({ id: canvas.id, error: getErrorMessage(err) }));
//         yield put(processError({ collectionId, canvasId: canvas.id }));
//       }
//     }
//   } catch (error) {
//     console.error('handleFetchOcr: ', error);
//     // yield put(processError({ id: canvas.id, error: getErrorMessage(error) }));
//     yield put(processError({ collectionId, canvasId: canvas.id }));
//     yield put(pushError(getErrorMessage(error)));
//   }
// }

function* handleStartBatchLayoutProcess(
  action: PayloadAction<string>,
): Generator<Effect, void, Canvas[]> {
  const collectionId = action.payload;
  yield put(processRunning({ collectionId }));

  const collectionRepository = getCollectionRepository();
  const canvases = yield call(
    [collectionRepository, collectionRepository.getCanvasesByCollectionId],
    collectionId,
  );
  if (canvases === undefined || canvases.length === 0) {
    // yield put(processError({ error: 'No canvases found' }));
    return;
  }
  for (const canvas of canvases) {
    yield put(processStart({ collectionId, canvasId: canvas.id }));
  }
  for (let i = 0; i < canvases.length; i++) {
    yield call(handleFetchLayout, {
      canvas: canvases[i],
      collectionId,
      originalWidth: canvases[i].width ?? 0,
    });
  }
  yield put(processSuccess({ collectionId }));
}

// function* handleStartBatchOcrProcess(
//   action: PayloadAction<string>,
// ): Generator<Effect, void, Canvas[]> {
//   const collectionId = action.payload;
//   yield put(processRunning({ collectionId }));

//   const collectionRepository = getCollectionRepository();
//   const canvases = yield call(
//     [collectionRepository, collectionRepository.getCanvasesByCollectionId],
//     collectionId,
//   );
//   if (canvases === undefined || canvases.length === 0) {
//     // yield put(processError({ error: 'No canvases found' }));
//     return;
//   }
//   for (const canvas of canvases) {
//     yield put(processStart({ collectionId, canvasId: canvas.id }));
//   }
//   const batchSize = 10; // Number of canvases to process in parallel
//   try {
//     for (let i = 0; i < canvases.length; i += batchSize) {
//       const batch = canvases.slice(i, i + batchSize);
//       yield all(
//         batch.map((canvas) => call(handleFetchOcr, { canvas, collectionId, region: undefined })),
//       );
//     }
//     yield put(processSuccess({ collectionId }));
//   } catch (error) {
//     console.error('Error fetching canvases:', error);
//   }
// }

function* handleStartProcess(action: PayloadAction<fetchLayoutPayload>) {
  yield fork(handleFetchLayout, action.payload);
}

// function* handleStartOcrProcess(action: PayloadAction<fetchOcrPayload>) {
//   yield fork(handleFetchOcr, action.payload);
// }

function* handleStartWorkerProcess(action: PayloadAction<StartWorkerProcessPayload>) {
  const { workerName, params, scope } = action.payload;
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
  };
  yield call(forkStartWorker, worker);
}

function* handleRecoverWorker(action: PayloadAction<Worker>) {
  const worker = action.payload;
  yield call(forkStartWorker, worker);
}

// type WorkerTask = ForkedTask<SagaReturnType<typeof startWorker>>;
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
    completed: take(processSuccess.type),
  })) as WorkerForkRaceResult;
  console.log(`Worker ${worker.name} finished with result:`, result);
  if ('stopped' in result) {
    console.log(`Worker ${worker.name} was stopped`);

    yield cancel(task);
  }
}

/**
 *
 * @param worker Worker or WorkerCreateDTO
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
        [workerRepository, workerRepository.selectByNameAndScope],
        worker.name,
        worker.scope,
      )) as Worker | undefined;
      if (existingWorker !== undefined) {
        yield call([workerRepository, workerRepository.delete], existingWorker);
        yield put(removeWorkerRequest(existingWorker));
      }
      //then, create a new worker
      currentWorker = (yield call([workerRepository, workerRepository.add], worker)) as Worker;

      //initialize the worker queue if the scope is collection
      currentWorker.queue = [];
      if (isCollectionScope(worker.scope)) {
        const collectionId = worker.scope.collectionId;
        const collectionRepository = getCollectionRepository();
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
          yield put(updateWorker(currentWorker));
          return;
        }
        //else, we add the canvases to the worker queue
        currentWorker.queue = canvases.map((canvas, index) => ({
          id: index,
          scope: { collectionId: collectionId, canvasId: canvas.id },
          status: WorkerStatus.WAITING,
        }));
        yield call([workerRepository, workerRepository.patch], currentWorker.id, {
          queue: currentWorker.queue,
        });
      } else if (isCanvasScope(worker.scope)) {
        //add the canvas to the worker queue
        currentWorker.queue.push({
          id: 0,
          scope: worker.scope,
          status: WorkerStatus.WAITING,
        });
      }
    }
    //update the store
    yield put(updateWorker(currentWorker));

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
      yield put(updateWorker(currentWorker));

      //start the saga for the task
      try {
        const taskResult = (yield call(saga.run, task, worker.params)) as WorkerResponse;
        switch (taskResult.status) {
          case WorkerStatus.COMPLETED:
            {
              console.log(`Task for scope ${toString(task.scope)} completed successfully`);
              //save the result in the database
              const result: ResultCreateDTO = {
                scope: task.scope,
                workerName: currentWorker.name,
                workerId: currentWorker.id,
                value: taskResult.content,
                taskId: task.id,
              };

              const newResult = (yield call(
                [resultRepository, resultRepository.addResult],
                result,
              )) as Result;
              currentWorker = {
                ...currentWorker,
                queue: updateTaskStatus(currentWorker.queue, idTask, WorkerStatus.COMPLETED, ''), //on ajoute un message vide pour supprimer un potentiel précédent message d'erreur
              };
              yield put(addResult(newResult));
            }
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
      yield put(updateWorker(currentWorker));
    } //end while loop

    if (hasError) {
      currentWorker = { ...currentWorker, status: WorkerStatus.COMPLETED_WITH_ERRORS };
    } else {
      currentWorker = { ...currentWorker, status: WorkerStatus.COMPLETED };
    }
    yield call([workerRepository, workerRepository.patch], currentWorker.id, {
      status: currentWorker.status,
    });
    yield put(updateWorker(currentWorker));
    yield put(pushInfo(i18n.t('info_worker_completed')));
    // } catch (error) {
    //   console.error(`Error in plugin saga for ${worker.name}:`, error);
    //     yield call([workerRepository, workerRepository.patch], currentWorker.id, {
    //       status: WorkerStatus.ERROR,
    //       statusMessage: getErrorMessage(error),
    //     });
    //     yield put(pushError(`Error in plugin saga for ${worker.name}: ${getErrorMessage(error)}`));
    // }
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
        yield put(updateWorker(currentWorker));
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

function* handleExportWorkerResult(
  action: PayloadAction<ExportWorkerPayload>,
): Generator<Effect, void, Result[] | Collection> {
  const { worker } = action.payload;
  const saga = workerPlugins[worker.name];

  //get the results for the worker
  const resultRepository = getResultRepository();
  const results = (yield call(
    [resultRepository, resultRepository.selectByWorkerId],
    worker.id,
  )) as Result[];

  try {
    if (saga !== undefined && saga !== null && saga.export) {
      if (results.length === 0) {
        //TODO! afficher message d'erreur dans l'UI
        console.warn(`No results found for worker ${worker.id}`);
        return;
      }

      yield call(saga.export, results);
    }
  } catch (error) {
    console.error(`Error in export plugin saga for ${worker.name}:`, error);
    yield put(
      pushError(`Error in export plugin saga for ${worker.name}: ${getErrorMessage(error)}`),
    );
  }
}

/**
 * Fetch all workers and their results from the IndexedDB.
 * This function is called when the application starts to load the workers and their results into the Redux store.
 */
function* fetchWorkers(): Generator<Effect, void, Worker[] | Result[]> {
  const workerRepository = getWorkerRepository();
  const workers = (yield call([workerRepository, workerRepository.selectAll])) as Worker[];

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

  yield put(setWorkers(workers));

  //!Est-qu'on en a besoin ?
  const resultRepository = getResultRepository();
  const results = (yield call([resultRepository, resultRepository.selectAll])) as Result[];
  yield put(setResults(results));
}

export default function* workerSaga() {
  yield takeLatest(fetchLayoutRequest, handleStartProcess);
  // yield takeLatest(fetchOcrRequest, handleStartOcrProcess);
  // yield takeLatest(fetchBatchOcrRequest, handleStartBatchOcrProcess);
  yield takeLatest(fetchBatchLayoutRequest, handleStartBatchLayoutProcess);
  yield takeEvery(startWorkerProcess, handleStartWorkerProcess);
  yield takeEvery(exportWorkerResultRequest, handleExportWorkerResult);
  yield takeEvery(recoverWorkerRequest, handleRecoverWorker);
}

export { fetchWorkers };
