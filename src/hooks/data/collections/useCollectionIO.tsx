import { Annotation } from '@/data/models/Annotation';
import { Collection } from '@/data/models/Collection';
import { DataModel } from '@/data/models/DataModel';
import { Result } from '@/data/models/Result';
import { Worker } from '@/data/models/Worker';
import {
  getAnnotationRepository,
  getCollectionRepository,
  getManifestRepository,
  getModelRepository,
  getResultRepository,
  getWorkerRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { getImage } from '@/data/utils/canvas';
import { generateManifestFromCollection } from '@/data/utils/export';
import { useAppDispatch } from '@/hooks/hooks';
import i18n from '@/i18n';
import { pushError, pushInfo } from '@/state/reducers/events';
import { fecthManifestRequest } from '@/state/reducers/manifests';
import { getErrorMessage } from '@/utils/utils';
import FileSaver from 'file-saver';
import { default as JSZip } from 'jszip';
import { uniq } from 'lodash';
import { useMemo } from 'react';

export interface ExportCollectionOptions {
  annotations?: boolean;
  model?: boolean;
  workers?: boolean;
  manifest?: boolean;
}

export const useCollectionIO = () => {
  const appDispatch = useAppDispatch();
  const collectionRepository = useMemo(() => getCollectionRepository(), []);

  const importCollections = async (data: ArrayBuffer) => {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(data);
    for (const filename in zipContent.files) {
      const file = zipContent.files[filename];
      if (!file.dir) {
        const fileContent = await file.async('string');
        try {
          const json = JSON.parse(fileContent) as object;
          await importCollection(filename, json);
        } catch (e) {
          appDispatch(pushError(getErrorMessage(e)));
        }
      }
    }
  };

  const importCollection = async (filename: string, json: object) => {
    if (!('collection' in json)) {
      appDispatch(pushError(i18n.t('error_import_not_a_collection', { file: filename })));
      return;
    }

    const { collection, annotations, model, workers, results } = json as {
      collection: Collection;
      annotations?: Annotation[];
      model?: DataModel;
      workers?: Worker[];
      results?: Result[];
    };

    //réimporte les manifestes liés à la collection (si besoin)
    const manifests = uniq(collection.content.map((item) => item.manifestId));
    manifests.forEach((manifestId) => {
      if (manifestId.startsWith('http://') || manifestId.startsWith('https://')) {
        appDispatch(fecthManifestRequest(manifestId));
      }
    });

    try {
      await collectionRepository.create(collection);
    } catch (e) {
      if (typeof e === 'object' && e !== null && 'name' in e && e.name === 'ConstraintError') {
        appDispatch(
          pushError(i18n.t('error_import_collection_already_exists', { id: collection.id })),
        );
      } else {
        appDispatch(
          pushError(
            i18n.t('error_import_collection', { file: filename, error: getErrorMessage(e) }),
          ),
        );
      }
      return;
    }

    if (annotations !== undefined && annotations.length > 0) {
      const annotationRepository = getAnnotationRepository();
      await annotationRepository.addAll(annotations);
    }

    if (model !== undefined) {
      try {
        const modelRepository = getModelRepository();
        await modelRepository.add(model);
      } catch (error) {
        console.error('Error importing model:', getErrorMessage(error));
      }
    }

    if (workers !== undefined && workers.length > 0) {
      try {
        const workerRepository = getWorkerRepository();
        await workerRepository.addAll(workers);
      } catch (error) {
        console.error('Error importing workers:', getErrorMessage(error));
      }
    }

    if (results !== undefined && results.length > 0) {
      try {
        const resultRepository = getResultRepository();
        await resultRepository.addAll(results);
      } catch (error) {
        console.error('Error importing results:', getErrorMessage(error));
      }
    }
    //TODO: add the tags
    // yield put(updateCollectionSuccess({ ...newCollection, tags: tags.map((tag) => tag.id) }));
    appDispatch(pushInfo(i18n.t('toast_collection_imported', { file: filename })));
  };

  /**
   * Export one or more collections to a zip file
   * @param action The ids of the collections to export
   */
  const exportCollections = async (collectionIds: string[], options: ExportCollectionOptions) => {
    const zip = new JSZip();
    for (let i = 0; i < collectionIds.length; i++) {
      const id = collectionIds[i];

      const exists = await collectionRepository.exists(id);
      if (!exists) {
        console.warn(`Collection with id ${id} does not exist, skipping export`);
        continue;
      }

      const collection = await collectionRepository.getById(id);

      const exportedCollection = { collection };

      if (options.annotations === true) {
        const annotationRepository = getAnnotationRepository();
        const annotations = await annotationRepository.getByScope({ collectionId: id });
        Object.assign(exportedCollection, { annotations });
      }

      if (options.model === true && collection.modelId !== undefined) {
        try {
          const modelRepository = getModelRepository();
          const model = await modelRepository.getById(collection.modelId);
          Object.assign(exportedCollection, { model });
        } catch (error) {
          console.error('Error fetching model:', getErrorMessage(error));
        }
      }

      if (options.workers === true) {
        try {
          const workerRepository = getWorkerRepository();
          const workers = await workerRepository.getByScope({ collectionId: id }, true);

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
          console.error('Error fetching model:', getErrorMessage(error));
        }
      }

      if (options.manifest === true) {
        try {
          const { name, manifest } = await generateManifestFromCollection(id);
          console.log(name, ' --> ', manifest);
          zip.file(name + '_manifest.json', JSON.stringify(manifest, null, 2));
        } catch (error) {
          console.error('Error generating manifest:', getErrorMessage(error));
          continue;
        }
      }

      zip.file(collection.name + '.json', JSON.stringify(exportedCollection, null, 2));
    }
    const zipContent = await zip.generateAsync({ type: 'blob' });
    FileSaver.saveAs(zipContent, 'exported_collections.zip');

    //TODO : il faudrait ajouter un message de succès (avec potentiellement certaines erreurs) ou un message d'erreur
    //exportSuccess
    //exportSuccessWithErrors
    //exportError
  };

  const toggleCollectionOffline = async (collectionId: string) => {
    try {
      const collection = await collectionRepository.getById(collectionId);
      if (collection === undefined) {
        appDispatch(pushError(i18n.t('error_collection_not_found')));
        return;
      }
      await collectionRepository.updateOffline(collectionId, !collection.offline);
      // yield put(updateCollectionSuccess({ ...collection, offline: !collection.offline }));
      if (!collection.offline) {
        //collection is now available offline
        appDispatch(pushInfo(i18n.t('toast_collection_offline')));
      } else {
        //collection is not available offline anymore
        appDispatch(pushInfo(i18n.t('toast_collection_online')));
      }
      console.log('Notifying service worker');
      if (navigator.serviceWorker?.controller) {
        const manifestRepository = getManifestRepository();
        const imageUrls = [];
        for (let i = 0; i < collection.content.length; i++) {
          const canvas = await manifestRepository.getCanvasById(
            collection.content[i].manifestId,
            collection.content[i].canvasId,
          );
          try {
            imageUrls.push(getImage(canvas).id);
          } catch (e) {
            console.warn(`No image found for canvas ${canvas.id}`);
          }
        }
        console.log(imageUrls);

        navigator.serviceWorker?.controller?.postMessage({
          action: !collection.offline ? 'addToCache' : 'removeFromCache',
          imageUrls,
        });
      }
    } catch (e) {
      appDispatch(pushError(getErrorMessage(e)));
    }
  };

  return { importCollection, importCollections, exportCollections, toggleCollectionOffline };
};
