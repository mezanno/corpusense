import { convertEdwinResult, EdwinBox } from '@/data/models/converters/edwinMagic';
import { Task, WorkerResponse, WorkerStatus } from '@/data/models/Worker';
import { getAnnotationRepository } from '@/data/repositories/indexeddb/dbFactory';
import { getImage } from '@/data/utils/canvas';
import { addAnnotationsSuccess } from '@/state/reducers/annotations';
import { PluginParams } from '@/state/reducers/workers';
import { getErrorMessage } from '@/utils/utils';
import { PredictReturn } from 'node_modules/@gradio/client/dist/types';
import { call, Effect, put } from 'redux-saga/effects';

export const pluginName = 'edwin';

export default function* edwinSaga(
  task: Task,
  _params: PluginParams,
): Generator<Effect, WorkerResponse, Response | PredictReturn> {
  try {
    const image = getImage(task.canvas);

    const response: Response = (yield call(
      fetch,
      // `http://localhost:3000/layout?image_url=${imageUrl}`,
      `https://api.mezanno.xyz/layout?image_url=${image.id}`,
    )) as Response;
    if (!response.ok) {
      return {
        status: WorkerStatus.ERROR,
        statusMessage: 'Network response was not ok',
      };
    }
    const data = yield call([response, 'json']);
    console.log('data: ', data);
    //convert the result into an array of Annotation
    const annotations = convertEdwinResult(
      data as unknown as EdwinBox[],
      task.canvas.id,
      task.scope.collectionId,
      task.canvas.width ?? 0,
    );
    //and send it to the redux store
    yield put(addAnnotationsSuccess(annotations));
    const annotationRepository = getAnnotationRepository();
    yield call([annotationRepository, annotationRepository.saveAllAnnotations], annotations);
  } catch (error) {
    return {
      status: WorkerStatus.ERROR,
      statusMessage: getErrorMessage(error),
    };
  }
  return {
    status: WorkerStatus.COMPLETED,
  };
}
