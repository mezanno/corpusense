import { AnnotationDTO, createAnnotation, ElementType } from '@/data/models/Annotation';
import { Result } from '@/data/models/Result';
import { isCanvasScope, toString } from '@/data/models/Scope';
import { Task, Worker, WorkerResponse, WorkerStatus } from '@/data/models/Worker';
import {
  getAnnotationRepository,
  getCollectionRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { getImage } from '@/data/utils/canvas';
import { applyModifierChainToAnnotations } from '@/data/utils/modifierChain';
import i18n from '@/i18n';
import { supabase } from '@/utils/config';
import { getErrorMessage } from '@/utils/utils';
import FileSaver from 'file-saver';
import z from 'zod';
import { uploadCanvasImage } from './supabase/utils';
import { WorkerCategory } from './WorkerCategory';

export const pluginName = 'customWorker'; //name of the plugin, used to register the plugin inside Corpusense
export const pluginDisplayName = 'Traitement custom'; //display name of the plugin, used in the UI
export const pluginDescription = i18n.t('plugin_layout_description'); //description of the plugin, used in the UI
export const pluginCategory = WorkerCategory.LAYOUT;
export const pluginRuntimeParameters = z.object({
  category: z
    // .enum([i18n.t('category_layout'), i18n.t('category_ocr'), i18n.t('category_llm')])
    .enum([WorkerCategory.LAYOUT, WorkerCategory.OCR, WorkerCategory.LLM])
    .describe('Catégorie de traitement à utiliser'),
  name: z.string().describe('Nom du traitement'),
});
export const experimental = true;

// interface Region {
//   xtl: number;
//   ytl: number;
//   xbr: number;
//   ybr: number;
// }

const layoutResponseSchema = z.object({
  regions: z.array(
    z.object({
      polygon: z.array(z.tuple([z.number(), z.number()])),
      type: z.string(),
    }),
  ),
});
type LayoutResult = z.infer<typeof layoutResponseSchema>;

export default async function run(task: Task, worker: Worker): Promise<WorkerResponse> {
  console.log(`Processing task for scope ${toString(task.scope)} with params: `, worker.params);

  const paramsValidation = pluginRuntimeParameters.safeParse(worker.params);
  if (!paramsValidation.success) {
    console.error('Invalid parameters for pero layout worker: ', paramsValidation.error);
    return {
      status: WorkerStatus.ERROR,
      statusMessage: getErrorMessage(paramsValidation.error.message),
    };
  }
  const params = paramsValidation.data;

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
    if (image.id === undefined) {
      return {
        status: WorkerStatus.ERROR,
        statusMessage: 'Image ID is undefined',
      };
    }

    // const regions: Region[] = await computeRegionsForTask(task, canvas);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (user !== null) {
        const imageUrl = await uploadCanvasImage(image);

        const { data, error: supabaseError } = await supabase
          .from('cs_jobs')
          .insert({
            worker_id: worker.id,
            task_id: task.id,
            worker_name: params.name,
            worker_category: params.category,
            payload: {
              url: imageUrl,
            },
            user_id: user.id,
            status: 'pending',
            plugin_name: pluginName,
          })
          .select();
        if (supabaseError || data === null) {
          throw supabaseError;
        }
        return {
          status: WorkerStatus.POSTED,
          statusMessage: 'Task has been added to the processing queue',
        };
      } else {
        console.log('User not connected');
        return {
          status: WorkerStatus.ERROR,
          statusMessage: i18n.t('info_not_connected'),
        };
      }
    } catch (error) {
      console.log('Error calling custom worker: ', error);
      return {
        status: WorkerStatus.ERROR,
        statusMessage: getErrorMessage(error),
      };
    }
  } catch (error) {
    console.log('Error in peroocr worker: ', error);

    return {
      status: WorkerStatus.ERROR,
      statusMessage: getErrorMessage(error),
    };
  }
}

// async function computeRegionsForTask(task: Task, canvas: Canvas) {
//   const annotationRepository = getAnnotationRepository();
//   let regions: Region[] = [];
//   if (isAnnotationScope(task.scope)) {
//     const annotation = await annotationRepository.getById(task.scope.annotationId);
//     regions = [
//       {
//         xtl: annotation.target.selector.geometry.bounds.minX,
//         ytl: annotation.target.selector.geometry.bounds.minY,
//         xbr: annotation.target.selector.geometry.bounds.maxX,
//         ybr: annotation.target.selector.geometry.bounds.maxY,
//       },
//     ];
//   } else {
//     const annotations = await annotationRepository.getByScope({
//       canvasId: canvas.id,
//       collectionId: task.scope.collectionId,
//     });
//     const annotationRegions = annotations.filter(
//       (a) => getAnnotationType(a) === ElementType.TEXT_REGION,
//     );
//     if (annotationRegions.length > 0) {
//       regions = annotationRegions
//         .sort((a1, a2) => (a1.order ?? 0) - (a2.order ?? 0))
//         .map((annotation) => {
//           return {
//             xtl: annotation.target.selector.geometry.bounds.minX,
//             ytl: annotation.target.selector.geometry.bounds.minY,
//             xbr: annotation.target.selector.geometry.bounds.maxX,
//             ybr: annotation.target.selector.geometry.bounds.maxY,
//           };
//         });
//     }
//   }
//   return regions;
// }

/*
 * The scope must be a CanvasScope
 */
export async function processResult(
  result: LayoutResult,
  task: Task,
  workerCategory: string,
): Promise<WorkerResponse> {
  if (workerCategory === WorkerCategory.LAYOUT) {
    return await processLayoutResult(result, task);
  } else {
    //for other categories, we don't have a predefined way to process the result, so we just return the result as is and let the UI handle it
    return {
      status: WorkerStatus.COMPLETED,
      content: result,
    };
  }
}

async function processLayoutResult(result: LayoutResult, task: Task): Promise<WorkerResponse> {
  if (!isCanvasScope(task.scope)) {
    throw new Error(i18n.t('error_task_invalid_scope'));
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
  const collection = await collectionRepository.getById(task.scope.collectionId);
  let savedAnnotations;
  if (
    collection.postLayoutModifierChainId !== undefined &&
    collection.postLayoutModifierChainId.trim() !== ''
  ) {
    const updatedAnnotations = await applyModifierChainToAnnotations(
      collection.postLayoutModifierChainId,
      newAnnotations.map((a) => ({ ...a, order: 0 })), //we have to set the order to transofrm AnnotationDTO into Annotation for the modifier chain function, but it will be reset when saving the annotations
    );
    savedAnnotations = await annotationRepository.addAll(updatedAnnotations);
  } else {
    savedAnnotations = await annotationRepository.addAll(newAnnotations);
  }

  return {
    status: WorkerStatus.COMPLETED,
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
