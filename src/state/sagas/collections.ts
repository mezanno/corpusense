import { Annotation, ElementType } from '@/data/models/Annotation';
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
import { generateManifestFromCollection, ManifestExport } from '@/data/utils/export';
import i18n from '@/i18n';
import { getErrorMessage } from '@/utils/utils';
import { Canvas } from '@iiif/presentation-3';
import { PayloadAction } from '@reduxjs/toolkit';
import FileSaver from 'file-saver';
import { default as JSZip, default as JSZIP } from 'jszip';
import { uniq } from 'lodash';
import { call, CallEffect, Effect, put, takeEvery } from 'redux-saga/effects';
import {
  ExportCollectionOptions,
  exportCollectionsRequest,
  ImportCollectionPayload,
  importCollectionRequest,
  importCollectionsRequest,
  loadCollectionRequest,
  loadCollectionSuccess,
  toggleCollectionOfflineRequest,
} from '../reducers/collections';
import { pushError, pushInfo } from '../reducers/events';
import { addResultsSuccess, addWorkersSuccess } from '../reducers/workers';
import { fetchManifestFromURL } from './manifests';

function* handleImportCollections(
  action: PayloadAction<ArrayBuffer>,
): Generator<Effect, void, JSZip | string> {
  const zip = new JSZip();
  const zipContent = (yield call(() => zip.loadAsync(action.payload))) as JSZip;
  for (const filename in zipContent.files) {
    const file = zipContent.files[filename];
    if (!file.dir) {
      const fileContent = (yield call(() => file.async('string'))) as string;
      try {
        const json = JSON.parse(fileContent) as object;
        yield call(handleImportCollection, {
          payload: { filename, json },
          type: importCollectionRequest.type,
        });
      } catch (e) {
        yield put(pushError(getErrorMessage(e)));
      }
    }
  }
}

function* handleImportCollection(
  _action: PayloadAction<ImportCollectionPayload>,
): Generator<Effect, void, void> {
  const { filename, json } = _action.payload;
  if (!('collection' in json)) {
    yield put(pushError(i18n.t('error_import_not_a_collection', { file: filename })));
    return;
  }

  const { collection, annotations, model, workers, results } = json as {
    collection: Collection;
    annotations?: Annotation[];
    model?: DataModel;
    workers?: Worker[];
    results?: Result[];
  };
  const collectionRepository = getCollectionRepository();
  try {
    yield call([collectionRepository, collectionRepository.create], collection);
  } catch (e) {
    if (typeof e === 'object' && e !== null && 'name' in e && e.name === 'ConstraintError') {
      yield put(pushError(i18n.t('error_import_collection_already_exists', { id: collection.id })));
    } else {
      yield put(
        pushError(i18n.t('error_import_collection', { file: filename, error: getErrorMessage(e) })),
      );
    }
    return;
  }

  if (annotations !== undefined && annotations.length > 0) {
    const annotationRepository = getAnnotationRepository();
    yield call([annotationRepository, annotationRepository.addAll], annotations);
  }

  if (model !== undefined) {
    try {
      const modelRepository = getModelRepository();
      yield call([modelRepository, modelRepository.add], model);
    } catch (error) {
      console.error('Error importing model:', getErrorMessage(error));
    }
  }

  if (workers !== undefined && workers.length > 0) {
    try {
      const workerRepository = getWorkerRepository();
      yield call([workerRepository, workerRepository.addAll], workers);
      yield put(addWorkersSuccess(workers));
    } catch (error) {
      console.error('Error importing workers:', getErrorMessage(error));
    }
  }

  if (results !== undefined && results.length > 0) {
    try {
      const resultRepository = getResultRepository();
      yield call([resultRepository, resultRepository.addAll], results);
      yield put(addResultsSuccess(results));
    } catch (error) {
      console.error('Error importing results:', getErrorMessage(error));
    }
  }
  //TODO: add the tags
  // yield put(updateCollectionSuccess({ ...newCollection, tags: tags.map((tag) => tag.id) }));
  // yield put(createCollectionSuccess(collection));
  yield put(pushInfo(i18n.t('toast_collection_imported', { file: filename })));
}

function* handleLoadCollection(
  action: PayloadAction<string>,
  // ): Generator<Effect, void, Collection | StoredItem[] | Canvas | Annotation[] | NamedEntity[]> {
): Generator<Effect, void, Collection | Canvas[] | Annotation[]> {
  try {
    const collectionRepository = getCollectionRepository();

    //get the collection to load
    const collectionToLoad = (yield call(
      [collectionRepository, collectionRepository.getById],
      action.payload,
    )) as Collection;
    if (collectionToLoad === undefined) {
      yield put(pushError(i18n.t('error_collection_not_found')));
      return;
    }
    console.log(`Loading collection ${collectionToLoad.name} (${collectionToLoad.id})`);

    //compute the list of manifest ids in the collection and fetch them
    const manifestIds = uniq(collectionToLoad.content.map((elt) => elt.manifestId));
    console.log('Looking for ', manifestIds);

    // yield all(
    //   manifestIds.map((manifestId) => {
    //     call(handleFetchManifestFromURL, manifestId);
    //   }),
    // );
    for (const manifestId of manifestIds) {
      yield call(fetchManifestFromURL, manifestId);
    }

    const canvases: Canvas[] = (yield call(
      [collectionRepository, collectionRepository.getCanvasesByCollectionId],
      collectionToLoad.id,
    )) as Canvas[];

    //create a dictionary of canvas id -> hasOcrAnnotations
    const annotationRepository = getAnnotationRepository();
    const canvasHasOcrAnnotations: { [key: string]: boolean } = {};
    for (const canvas of canvases) {
      const annotations = (yield call(
        [annotationRepository, annotationRepository.getByScopeAndTypes],
        { collectionId: action.payload, canvasId: canvas.id },
        [ElementType.TEXT_LINE],
      )) as Annotation[];
      canvasHasOcrAnnotations[canvas.id] = annotations.length > 0;
    }

    yield put(
      loadCollectionSuccess({ collection: collectionToLoad, canvases, canvasHasOcrAnnotations }),
    );

    //load the entities of the collection
    // const annotationsIds = annotations.map((annotation) => annotation.id);
    // const namedEntityRepository = getNamedEntityRepository();
    // const namedEntities = (yield call(
    //   [namedEntityRepository, namedEntityRepository.getNamedEntitiesByAnnotationsIds],
    //   annotationsIds,
    // )) as NamedEntity[];
    // yield put(loadEntitiesSuccess(namedEntities));
  } catch (e) {
    yield put(pushError(getErrorMessage(e)));
  }
}

function* handleToggleCollectionOffline(
  action: PayloadAction<string>,
): Generator<Effect, void, Collection | Canvas> {
  const collectionId = action.payload;
  try {
    const collectionRepository = getCollectionRepository();
    const collection = (yield call(
      [collectionRepository, collectionRepository.getById],
      collectionId,
    )) as Collection;
    if (collection === undefined) {
      yield put(pushError(i18n.t('error_collection_not_found')));
      return;
    }
    yield call(
      [collectionRepository, collectionRepository.updateOffline],
      collectionId,
      !collection.offline,
    );
    // yield put(updateCollectionSuccess({ ...collection, offline: !collection.offline }));
    if (!collection.offline) {
      //collection is now available offline
      yield put(pushInfo(i18n.t('toast_collection_offline')));
    } else {
      //collection is not available offline anymore
      yield put(pushInfo(i18n.t('toast_collection_online')));
    }
    console.log('Notifying service worker');
    if (navigator.serviceWorker?.controller) {
      const manifestRepository = getManifestRepository();
      const imageUrls = [];
      for (let i = 0; i < collection.content.length; i++) {
        const canvas = (yield call(
          [manifestRepository, manifestRepository.getCanvasById],
          collection.content[i].manifestId,
          collection.content[i].canvasId,
        )) as Canvas;
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
    yield put(pushError(getErrorMessage(e)));
  }
}

/**
 * Export one or more collections to a zip file
 * @param action The ids of the collections to export
 */
function* handleExportMultipleCollectionsRequest(
  action: PayloadAction<{ collectionIds: string[]; options: ExportCollectionOptions }>,
): Generator<
  CallEffect,
  void,
  boolean | ManifestExport | Blob | Collection | Annotation[] | DataModel | Worker[] | Result[]
> {
  const { collectionIds, options } = action.payload;
  const zip = new JSZIP();
  for (let i = 0; i < collectionIds.length; i++) {
    const id = collectionIds[i];

    const collectionRepository = getCollectionRepository();

    const exists = (yield call([collectionRepository, collectionRepository.exists], id)) as boolean;
    if (!exists) {
      console.warn(`Collection with id ${id} does not exist, skipping export`);
      continue;
    }

    const collection = (yield call(
      [collectionRepository, collectionRepository.getById],
      id,
    )) as Collection;
    const exportedCollection = { collection };

    if (options.annotations === true) {
      const annotationRepository = getAnnotationRepository();
      const annotations = (yield call([annotationRepository, annotationRepository.getByScope], {
        collectionId: id,
      })) as Annotation[];
      Object.assign(exportedCollection, { annotations });
    }

    if (options.model === true && collection.modelId !== undefined) {
      try {
        const modelRepository = getModelRepository();
        const model = (yield call(
          [modelRepository, modelRepository.getById],
          collection.modelId,
        )) as DataModel;
        Object.assign(exportedCollection, { model });
      } catch (error) {
        console.error('Error fetching model:', getErrorMessage(error));
      }
    }

    if (options.workers === true) {
      try {
        const workerRepository = getWorkerRepository();
        const workers = (yield call(
          [workerRepository, workerRepository.getByScope],
          { collectionId: id },
          true,
        )) as Worker[];

        if (workers.length > 0) {
          const allTheResults: Result[] = [];
          const resultRespository = getResultRepository();
          for (let j = 0; j < workers.length; j++) {
            const worker = workers[j];
            const workerResults = (yield call(
              [resultRespository, resultRespository.getAllByWorkerId],
              worker.id,
            )) as Result[];
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
        const { name, manifest } = (yield call(
          generateManifestFromCollection,
          id,
        )) as ManifestExport;
        console.log(name, ' --> ', manifest);
        zip.file(name + '_manifest.json', JSON.stringify(manifest, null, 2));
      } catch (error) {
        console.error('Error generating manifest:', getErrorMessage(error));
        continue;
      }
    }

    zip.file(collection.name + '.json', JSON.stringify(exportedCollection, null, 2));
  }
  const zipContent = (yield call(() => zip.generateAsync({ type: 'blob' }))) as Blob;
  yield call(FileSaver.saveAs, zipContent, 'exported_collections.zip');

  //TODO : il faudrait ajouter un message de succès (avec potentiellement certaines erreurs) ou un message d'erreur
  //exportSuccess
  //exportSuccessWithErrors
  //exportError
}

export default function* collectionsSaga() {
  yield takeEvery(importCollectionRequest, handleImportCollection);
  yield takeEvery(importCollectionsRequest, handleImportCollections);
  yield takeEvery(loadCollectionRequest, handleLoadCollection);
  yield takeEvery(toggleCollectionOfflineRequest, handleToggleCollectionOffline);
  yield takeEvery(exportCollectionsRequest, handleExportMultipleCollectionsRequest);
}

export { handleImportCollection, handleImportCollections, handleLoadCollection };
