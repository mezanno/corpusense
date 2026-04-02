import { convertEdwinResult, EdwinBox } from '@/data/models/converters/edwinMagic';
import { isCanvasScope } from '@/data/models/Scope';
import { Task, WorkerResponse, WorkerStatus } from '@/data/models/Worker';
import {
  getAnnotationRepository,
  getCollectionRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { getImage } from '@/data/utils/canvas';
import { getValueForPluginParam } from '@/data/utils/plugins';
import i18n from '@/i18n';
import { PluginParams } from '@/state/reducers/workers';
import { getErrorMessage } from '@/utils/utils';
import WorkerCategory from './WorkerCategory';

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
      status: WorkerStatus.ERROR,
      statusMessage: i18n.t('error_task_invalid_scope'),
    };
  }
  try {
    const collectionRepository = getCollectionRepository();
    const canvas = await collectionRepository.getCanvasByScope(task.scope);
    const image = getImage(canvas);

    const url = getValueForPluginParam(pluginName, 'apiUrl');
    if (url === null) {
      return {
        status: WorkerStatus.ERROR,
        statusMessage: 'API URL is not configured',
      };
    }
    const response: Response = await fetch(`${url}?image_url=${image.id}`);
    if (!response.ok) {
      return {
        status: WorkerStatus.ERROR,
        statusMessage: 'Network response was not ok',
      };
    }
    const data: unknown = await response.json();
    console.log('data: ', data);
    //convert the result into an array of Annotation
    const annotations = convertEdwinResult(
      data as EdwinBox[],
      canvas.id,
      task.scope.collectionId,
      canvas.width ?? 0,
    );
    //and send it to the redux store
    const annotationRepository = getAnnotationRepository();
    const newAnnotations = await annotationRepository.addAll(annotations);
    return {
      status: WorkerStatus.COMPLETED,
      content: newAnnotations,
    };
  } catch (error) {
    return {
      status: WorkerStatus.ERROR,
      statusMessage: getErrorMessage(error),
    };
  }
}
