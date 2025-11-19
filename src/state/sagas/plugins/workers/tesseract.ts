import { createAnnotation, ElementType, getAnnotationType } from '@/data/models/Annotation';
import { Result } from '@/data/models/Result';
import { isAnnotationScope, toString } from '@/data/models/Scope';
import { Task, WorkerResponse, WorkerStatus } from '@/data/models/Worker';
import {
  getAnnotationRepository,
  getCollectionRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { getImage } from '@/data/utils/canvas';
import { parseDirectoryForFile } from '@/hooks/useFs';
import { PluginParams } from '@/state/reducers/workers';
import { useFSHandleStore } from '@/state/zustand/useFSHandleStore';
import { getErrorMessage } from '@/utils/utils';
import FileSaver from 'file-saver';
import Tesseract, { createWorker } from 'tesseract.js';

export const pluginName = 'tesseractocr';
export const pluginDisplayName = 'Tesseract OCR';
export const pluginDescription = 'Reconnaissance de texte sans Internet !';
export const pluginCategory = 'OCR';
export const pluginExportFormats = ['txt'];

let worker: Tesseract.Worker | null = null;

export const getTesseractWorker = async () => {
  if (worker === null) {
    worker = await createWorker('fra', 1, {
      //   logger: (m) => console.log('[OCR]', m), // optionnel
    });
  }
  return worker;
};

export default async function run(task: Task, _params: PluginParams): Promise<WorkerResponse> {
  console.log(`Processing task for scope ${toString(task.scope)}`);

  try {
    const annotationRepository = getAnnotationRepository();
    const collectionRepository = getCollectionRepository();
    const canvas = await collectionRepository.getCanvasByScope(task.scope);
    const image = getImage(canvas);
    if (image.id === undefined) {
      return {
        status: WorkerStatus.ERROR,
        statusMessage: 'Image ID is undefined',
      };
    }
    let regions: Tesseract.Rectangle[] = [];
    if (isAnnotationScope(task.scope)) {
      const annotation = await annotationRepository.getById(task.scope.annotationId);
      regions = [
        {
          left: annotation.target.selector.geometry.bounds.minX,
          top: annotation.target.selector.geometry.bounds.minY,
          width:
            annotation.target.selector.geometry.bounds.maxX -
            annotation.target.selector.geometry.bounds.minX,
          height:
            annotation.target.selector.geometry.bounds.maxY -
            annotation.target.selector.geometry.bounds.minY,
        },
      ];
    } else {
      const annotations = await annotationRepository.getByScope({
        canvasId: canvas.id,
        collectionId: task.scope.collectionId,
      });
      const annotationRegions = annotations.filter(
        (a) => getAnnotationType(a) === ElementType.TEXT_REGION,
      );
      if (annotationRegions.length > 0) {
        regions = annotationRegions
          .sort((a1, a2) => (a1.order ?? 0) - (a2.order ?? 0))
          .map((annotation) => {
            return {
              left: annotation.target.selector.geometry.bounds.minX,
              top: annotation.target.selector.geometry.bounds.minY,
              width:
                annotation.target.selector.geometry.bounds.maxX -
                annotation.target.selector.geometry.bounds.minX,
              height:
                annotation.target.selector.geometry.bounds.maxY -
                annotation.target.selector.geometry.bounds.minY,
            };
          });
      }
    }

    let imageToProcess: string | File = image.id;
    //check if the image is a local file
    if (!imageToProcess.toLocaleLowerCase().startsWith('http')) {
      const rootHendle = useFSHandleStore.getState().rootHandle;
      if (rootHendle === undefined) {
        throw new Error('Root handle is undefined');
      }
      const file = await parseDirectoryForFile(rootHendle, image.id);
      if (file === undefined) {
        throw new Error(`${image.id} not found in local file system`);
      }
      imageToProcess = await file.getFile();
    }
    console.log('imageToProcess: ', imageToProcess);

    const tesseractWorker = await getTesseractWorker();
    const annotations = [];
    if (regions.length === 0) {
      // If no regions, process the whole image
    } else {
      for (let r = 0; r < regions.length; r++) {
        const region = regions[r];
        console.log(`Processing region ${r + 1}/${regions.length}`);
        console.log(region);

        const { data } = await tesseractWorker.recognize(
          imageToProcess,
          { rectangle: region },
          {
            blocks: true,
            text: false,
          },
        );
        // console.log('data: ', data);

        if (data.blocks && data.blocks.length > 0) {
          for (const paragraph of data.blocks[0].paragraphs) {
            for (const line of paragraph.lines) {
              if (line.confidence > 60) {
                annotations.push(
                  createAnnotation({
                    canvasId: task.scope.canvasId,
                    collectionId: task.scope.collectionId,
                    minX: line.bbox.x0,
                    minY: line.bbox.y0,
                    maxX: line.bbox.x1,
                    maxY: line.bbox.y1,
                    type: ElementType.TEXT_LINE,
                    value: line.text,
                  }),
                );
              }
            }
          }
        }
      }
    }

    const newAnnotations =
      annotations.length > 0 ? await annotationRepository.addAll(annotations) : [];
    return {
      status: WorkerStatus.COMPLETED,
      content: newAnnotations,
    };
  } catch (error) {
    console.log('Error in peroocr worker: ', error);

    return {
      status: WorkerStatus.ERROR,
      statusMessage: getErrorMessage(error),
    };
  }
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
