import { ElementType } from '@/data/models/annotations/annotation';
import { AnnotationDTO } from '@/data/models/annotations/annotation.dto';
import { createAnnotation } from '@/data/models/annotations/annotation.factory';
import { Result } from '@/data/models/result/result';
import { isCanvasScope, toString } from '@/data/models/scope/scope.utils';
import { Task, Worker, WorkerEvent, WorkerResponse } from '@/data/models/worker/worker';
import {
  getAnnotationRepository,
  getCollectionRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { applyModifierChainToAnnotations } from '@/data/utils/modifierChain';
import { supabase } from '@/utils/config';
import { getErrorMessage } from '@/utils/utils';
import FileSaver from 'file-saver';
import i18n from 'i18next';
import z from 'zod';
import { InvalidTaskScopeError, JobPostError } from '../errors';
import { uploadCanvasImage } from './supabase/utils';
import { WorkerCategory } from './WorkerCategory';

export const pluginName = 'layoutExtraction'; //name of the plugin, used to register the plugin inside Corpusense
export const pluginDisplayName = 'Pero / PaddlePaddle'; //display name of the plugin, used in the UI
export const pluginDescription = i18n.t('plugin_layout_description'); //description of the plugin, used in the UI
export const pluginCategory = WorkerCategory.LAYOUT; //category of the plugin, used to group plugins in the UI
export const pluginRuntimeParameters = z.object({
  type: z.enum(['perolayout']).describe(i18n.t('plugin_layoutextraction_description')),
});
export const pluginExecutionStrategy = 'job' as const;
export const experimental = true;

const responseSchema = z.object({
  regions: z.array(
    z.object({
      polygon: z.array(z.tuple([z.number(), z.number()])),
      type: z.string(),
    }),
  ),
});
type PeroLayoutResult = z.infer<typeof responseSchema>;

export default async function run(task: Task, worker: Worker): Promise<WorkerResponse> {
  console.log(`Processing task for scope ${toString(task.scope)} with params: `, worker.params);

  const paramsValidation = pluginRuntimeParameters.safeParse(worker.params);
  if (!paramsValidation.success) {
    console.error('Invalid parameters for pero layout worker: ', paramsValidation.error);
    return {
      event: WorkerEvent.RESULT_ERR,
      message: getErrorMessage(paramsValidation.error.message),
    };
  }
  const params = paramsValidation.data;

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
        message: canvasWithSourceIdResult.error.message,
      };
    }
    const canvasWithSourceId = canvasWithSourceIdResult.value;
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (user !== null) {
        const imageUrl = await uploadCanvasImage(canvasWithSourceId);

        const { data, error: supabaseError } = await supabase
          .from('cs_jobs')
          .insert({
            worker_id: worker.id,
            task_id: task.id,
            worker_name: params.type,
            worker_category: pluginCategory,
            payload: {
              url: imageUrl,
            },
            user_id: user.id,
            status: 'pending',
            plugin_name: pluginName,
          })
          .select();
        if (supabaseError || data === null) {
          throw new JobPostError({
            plugin: pluginName,
            workerId: worker.id,
            taskId: task.id,
            cause:
              supabaseError !== null
                ? getErrorMessage(supabaseError)
                : 'job insert returned no row',
          });
        }
        return {
          event: WorkerEvent.JOB_ACCEPTED,
          message: 'Task has been added to the processing queue',
        };
      } else {
        console.log('User not connected');
        return {
          event: WorkerEvent.RESULT_ERR,
          message: i18n.t('info_not_connected'),
        };
      }
    } catch (error) {
      console.log('Error calling pero layout API: ', error);
      return {
        event: WorkerEvent.RESULT_ERR,
        message: getErrorMessage(error),
      };
    }
  } catch (error) {
    console.log('Error in peroocr worker: ', error);

    return {
      event: WorkerEvent.RESULT_ERR,
      message: getErrorMessage(error),
    };
  }
}

/*
 * The scope must be a CanvasScope
 */
export async function processResult(result: PeroLayoutResult, task: Task): Promise<WorkerResponse> {
  if (!isCanvasScope(task.scope)) {
    throw new InvalidTaskScopeError({
      plugin: pluginName,
      taskId: task.id,
      scope: toString(task.scope),
    });
  }

  const annotationRepository = getAnnotationRepository();
  const newAnnotations: AnnotationDTO[] = [];
  for (const region of result.regions) {
    const { minX, minY, maxX, maxY } = region.polygon.reduce(
      (acc, [x, y]) => {
        return {
          minX: Math.min(acc.minX, x),
          minY: Math.min(acc.minY, y),
          maxX: Math.max(acc.maxX, x),
          maxY: Math.max(acc.maxY, y),
        };
      },
      {
        minX: Number.POSITIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY,
      },
    );
    const regionAnnotation = createAnnotation({
      canvasId: task.scope.canvasId,
      collectionId: task.scope.collectionId,
      minX,
      minY,
      maxX,
      maxY,
      type: ElementType.TEXT_REGION,
      value: region.type,
    });
    newAnnotations.push(regionAnnotation);
  }

  //delete previous regions
  await annotationRepository.deleteByScope(task.scope);

  //if a post-processing function is defined for the collection, apply it to the new annotations before saving them
  const collectionRepository = getCollectionRepository();
  const collectionResult = await collectionRepository.getById(task.scope.collectionId);
  const postLayoutModifierChainId = collectionResult.ok
    ? collectionResult.value.postLayoutModifierChainId
    : undefined;
  let savedAnnotations;
  if (postLayoutModifierChainId !== undefined && postLayoutModifierChainId.trim() !== '') {
    const updatedAnnotations = await applyModifierChainToAnnotations(
      postLayoutModifierChainId,
      newAnnotations.map((a) => ({ ...a, order: 0 })), //we have to set the order to transofrm AnnotationDTO into Annotation for the modifier chain function, but it will be reset when saving the annotations
    );
    savedAnnotations = await annotationRepository.addAll(updatedAnnotations);
  } else {
    savedAnnotations = await annotationRepository.addAll(newAnnotations);
  }

  return {
    event: WorkerEvent.RESULT_OK,
    content: savedAnnotations,
  };
}

export function exportResult(results: Result[], formats: string[]) {
  if (results.length === 0) {
    console.warn(`No results to export from ${pluginDisplayName} plugin`);
    return;
  }

  if (formats.includes('txt')) {
    const text = results.map((r) => r.value).join('\n\n');
    FileSaver.saveAs(new Blob([text], { type: 'text/plain;charset=utf-8' }), 'exported_text.txt');
  }
}

export const setIiifSize = (url: string, width: number, height: number) => {
  return url.replace(/\/full\/[^/]+\/0\//, `/full/${width},${height}/0/`);
};
