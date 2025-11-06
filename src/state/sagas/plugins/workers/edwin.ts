import { convertEdwinResult, EdwinBox } from '@/data/models/converters/edwinMagic';
import { Task, WorkerResponse, WorkerStatus } from '@/data/models/Worker';
import {
  getAnnotationRepository,
  getCollectionRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { getImage } from '@/data/utils/canvas';
import { PluginParams } from '@/state/reducers/workers';
import { getErrorMessage } from '@/utils/utils';

export const pluginName = 'edwin';
export const pluginDisplayName = 'Détection de layout Edwin';
export const pluginDescription = "Détection de layout avec utilisant la magie d'Edwin";
export const pluginCategory = 'Layout';
export const experimental = true;

export default async function run(task: Task, _params: PluginParams): Promise<WorkerResponse> {
  try {
    const collectionRepository = getCollectionRepository();
    const canvas = await collectionRepository.getCanvasByScope(task.scope);
    const image = getImage(canvas);

    const response: Response = await fetch(`https://api.mezanno.xyz/layout?image_url=${image.id}`);
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
