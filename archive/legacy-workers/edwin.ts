import { convertEdwinResult, EdwinBox } from '@/data/models/converters/edwinMagic';
import { isCanvasScope } from '@/data/models/scope/scope.utils';
import { Task, WorkerEvent, WorkerResponse } from '@/data/models/worker/worker';
import {
  getAnnotationRepository,
  getCollectionRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { getImage } from '@/data/utils/canvas';
import { getValueForPluginParam } from '@/data/utils/plugins';
import i18n from '@/i18n';
import { PluginParams } from '@/state/reducers/workers';
import { getErrorMessage } from '@/utils/utils';
import { WorkerCategory } from '../WorkerCategory';

export const pluginName = 'edwin';
export const pluginDisplayName = 'Détection de layout Edwin';
export const pluginDescription = "Détection de layout avec utilisant la magie d'Edwin";
export const pluginCategory = WorkerCategory.LAYOUT;
export const experimental = true;
export const pluginConfigurationParams = {
  apiUrl: {
    description: "URL de l'API de détection de layouts (Edwin)",
    defaultValue: 'https://api.mezanno.xyz/layout',
  },
};

export default async function run(task: Task, _params: PluginParams): Promise<WorkerResponse> {
  if (!isCanvasScope(task.scope)) {
    return {
      event: WorkerEvent.RESULT_ERR,
      message: i18n.t('error_task_invalid_scope'),
    };
  }
  try {
    const collectionRepository = getCollectionRepository();
    const canvasWithSourceIdResult = await collectionRepository.getCanvasByScope(task.scope);

    if (!canvasWithSourceIdResult.ok) {
      return {
        event: WorkerEvent.RESULT_ERR,
        message: i18n.t('error_canvas_not_found'),
      };
    }
    const canvasWithSourceId = canvasWithSourceIdResult.value;
    const image = getImage(canvasWithSourceId.canvas);

    const url = getValueForPluginParam(pluginName, 'apiUrl');
    if (url === null) {
      return {
        event: WorkerEvent.RESULT_ERR,
        message: 'API URL is not configured',
      };
    }
    const response: Response = await fetch(`${url}?image_url=${image.id}`);
    if (!response.ok) {
      return {
        event: WorkerEvent.RESULT_ERR,
        message: 'Network response was not ok',
      };
    }
    const data: unknown = await response.json();
    console.log('data: ', data);
    //convert the result into an array of Annotation
    const annotations = convertEdwinResult(
      data as EdwinBox[],
      canvasWithSourceId.canvas.id,
      task.scope.collectionId,
      canvasWithSourceId.canvas.width ?? 0,
    );
    //and send it to the redux store
    const annotationRepository = getAnnotationRepository();
    const newAnnotations = await annotationRepository.addAll(annotations);
    return {
      event: WorkerEvent.RESULT_OK,
      content: newAnnotations,
    };
  } catch (error) {
    return {
      event: WorkerEvent.RESULT_ERR,
      message: getErrorMessage(error),
    };
  }
}
