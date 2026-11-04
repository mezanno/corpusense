import { Result } from '@/data/models/result/result';
import { SourceWithContentAndThumbnail } from '@/data/models/source/source';
import {
  getAnnotationRepository,
  getCollectionRepository,
  getModelRepository,
  getResultRepository,
  getSourceRepository,
  getTagRepository,
  getWorkerRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { generateManifestFromCollection } from '@/data/utils/export';
import { ProgressLoggerSetters } from '@/hooks/ui/useLogger';
import { getErrorMessage } from '@/utils/utils';
import FileSaver from 'file-saver';
import { default as JSZip } from 'jszip';
import { useMemo } from 'react';

export interface ExportCollectionOptions {
  annotations?: boolean;
  model?: boolean;
  workers?: boolean;
  workersScope?: 'collection' | 'all';
  manifest?: boolean;
}

export const useCollectionIO = (setters: ProgressLoggerSetters) => {
  const collectionRepository = useMemo(() => getCollectionRepository(), []);
  const { setStatus, setProgress, addLog } = setters;

  /**
   * Export one or more collections to a zip file
   * @param action The ids of the collections to export
   */
  const exportCollections = async (collectionIds: string[], options: ExportCollectionOptions) => {
    setStatus('processing');
    setProgress(0);

    const zip = new JSZip();
    for (let i = 0; i < collectionIds.length; i++) {
      const id = collectionIds[i];

      const collectionResult = await collectionRepository.getById(id);
      if (!collectionResult.ok) {
        addLog(`Collection with id ${id} does not exist, skipping export`, 'error');
        continue;
      }
      const collection = collectionResult.value;
      addLog(`Exporting collection ${collection.name} (${i + 1}/${collectionIds.length})`);

      const exportedCollection = { collection };

      if (collection.tags.length > 0) {
        const tagRepository = getTagRepository();
        const tags = await tagRepository.getByIds(collection.tags);
        Object.assign(exportedCollection, { tags });
      }

      const sourceIdsResult = await collectionRepository.getSourceIdsByCollectionId(collection.id);
      if (sourceIdsResult.ok && sourceIdsResult.value.length > 0) {
        const sourceRepository = getSourceRepository();
        const sources: SourceWithContentAndThumbnail[] = [];
        for (let j = 0; j < sourceIdsResult.value.length; j++) {
          const sourceId = sourceIdsResult.value[j];
          const sourceResult =
            await sourceRepository.getSourceWithContentAndThumbnailById(sourceId);
          if (sourceResult.ok) {
            sources.push(sourceResult.value);
          } else {
            addLog(`Source with id ${sourceId} does not exist, skipping export`, 'error');
          }
        }
        Object.assign(exportedCollection, { sources });
      }

      if (options.annotations === true) {
        const annotationRepository = getAnnotationRepository();
        const annotations = await annotationRepository.getByScope({ collectionId: id });
        Object.assign(exportedCollection, { annotations });
      }

      if (options.model === true && collection.modelId !== undefined) {
        try {
          const modelRepository = getModelRepository();
          const modelResult = await modelRepository.getById(collection.modelId);
          if (modelResult.ok) {
            Object.assign(exportedCollection, { model: modelResult.value });
          }
        } catch (error) {
          addLog(`Error adding model: ${getErrorMessage(error)}`, 'error');
        }
      }

      if (options.workers === true) {
        try {
          const workerRepository = getWorkerRepository();
          const subScope = options.workersScope !== 'collection';
          const workers = await workerRepository.getByScope({ collectionId: id }, subScope);

          if (workers.length > 0) {
            const allTheResults: Result[] = [];
            const resultRespository = getResultRepository();
            for (let j = 0; j < workers.length; j++) {
              const worker = workers[j];
              const workerResults = await resultRespository.getAllByWorkerId(worker.id);
              allTheResults.push(...workerResults);
            }
            Object.assign(exportedCollection, { workers });
            Object.assign(exportedCollection, { results: allTheResults });
          }
        } catch (error) {
          addLog(`Error adding workers: ${getErrorMessage(error)}`, 'error');
        }
      }

      if (options.manifest === true) {
        const manifestResult = await generateManifestFromCollection(id);
        if (!manifestResult.ok) {
          addLog(`Error generating manifest: ${getErrorMessage(manifestResult.error)}`, 'error');
          continue;
        }

        const { name, manifest } = manifestResult.value;
        try {
          zip.file(name + '_manifest.json', JSON.stringify(manifest, null, 2));
        } catch (error) {
          addLog(`Error generating manifest: ${getErrorMessage(error)}`, 'error');
        }
      }

      zip.file(collection.name + '.json', JSON.stringify(exportedCollection, null, 2));
      addLog(`Collection ${collection.name} added to export.`, 'success');
      setProgress(Math.round(((i + 1) / collectionIds.length) * 100));
    }
    setStatus('done');
    const zipContent = await zip.generateAsync({ type: 'blob' });
    FileSaver.saveAs(zipContent, 'exported_collections.zip');
    addLog('Export completed successfully.', 'success');
  };

  return { exportCollections };
};
