import { Annotation, ElementType } from '@/data/models/Annotation';
import { Collection, CollectionDetails, ExportedCollection } from '@/data/models/Collection';
import { DataModel } from '@/data/models/DataModel';
import { Result } from '@/data/models/Result';
import { Worker } from '@/data/models/Worker';
import {
  getAnnotationRepository,
  getCollectionRepository,
  getManifestRepository,
  getModelRepository,
  getResultRepository,
  getTagRepository,
  getWorkerRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { generateFirstAnnotation, importAnnotationFromJson } from '@/data/utils/annotations';
import { getImage } from '@/data/utils/canvas';
import { generateCollectionContent } from '@/data/utils/collections';
import { generateManifestFromCollection, ManifestExport } from '@/data/utils/export';
import i18n from '@/i18n';
import { getErrorMessage } from '@/utils/utils';
import { Canvas } from '@iiif/presentation-3';
import { PayloadAction } from '@reduxjs/toolkit';
import FileSaver from 'file-saver';
import { default as JSZip, default as JSZIP } from 'jszip';
import { uniq } from 'lodash';
import { call, CallEffect, Effect, put, PutEffect, takeEvery } from 'redux-saga/effects';
import { v4 as uuid } from 'uuid';
import {
  addSelectionToCollectionRequest,
  addSelectionToCollectionSuccess,
  createCollectionRequest,
  createCollectionSuccess,
  createCollectionWithSelectionRequest,
  ExportCollectionOptions,
  exportCollectionsRequest,
  importCollectionRequest,
  importCollectionsRequest,
  loadCollectionRequest,
  loadCollectionSuccess,
  removeCollectionRequest,
  removeCollectionSuccess,
  removeElementFromCollectionRequest,
  removeElementFromCollectionSuccess,
  setCollections,
  toggleCollectionOfflineRequest,
  updateCollectionRequest,
  updateCollectionSuccess,
} from '../reducers/collections';
import { pushError, pushInfo } from '../reducers/events';
import { removeWorkersSuccess } from '../reducers/workers';
import { fetchManifestFromURL } from './manifests';

function* fetchAllCollections(): Generator<
  CallEffect<CollectionDetails[]> | PutEffect,
  void,
  CollectionDetails[]
> {
  try {
    const collectionRepository = getCollectionRepository();
    const collections: CollectionDetails[] = yield call([
      collectionRepository,
      collectionRepository.getAllDetails,
    ]);

    yield put(setCollections(collections));
  } catch (e) {
    console.warn('Error loading collections from indexedDB', e);
  }
}

function* handleCreateCollection(action: PayloadAction<string>) {
  const name = action.payload;
  const newCollection: Collection = {
    id: uuid(),
    name,
    tags: [],
    contentSize: 0,
    content: [],
    offline: false,
  };

  try {
    const collectionRepository = getCollectionRepository();
    yield call([collectionRepository, collectionRepository.create], newCollection);
    yield put(createCollectionSuccess(newCollection));
    yield put(pushInfo(i18n.t('toast_collection_created')));
  } catch (e) {
    yield put(pushError(getErrorMessage(e)));
  }
}

function* handleUpdateCollection(action: PayloadAction<Collection>) {
  const { id, name, tags, content, modelId, offline } = action.payload;
  try {
    if (id === undefined) {
      // yield put(setError(i18next.t('error_collection_not_found')));
      return;
    }
    const collectionRepository = getCollectionRepository();
    yield call([collectionRepository, collectionRepository.update], id, {
      name,
      tags,
      content,
      modelId,
      offline,
    });

    yield put(updateCollectionSuccess(action.payload));
    yield put(pushInfo(i18n.t('toast_collection_saved')));
  } catch (e) {
    yield put(pushError(getErrorMessage(e)));
  }
}

/**

 * @param action id of the collection to remove
 */
function* handleRemoveCollection(
  action: PayloadAction<string>,
): Generator<Effect, void, Collection | { workersIds: string[]; collectionId: string }> {
  const id = action.payload; //id of the collection to remove
  try {
    const collectionRepository = getCollectionRepository();
    const collectionToRemove = (yield call(
      [collectionRepository, collectionRepository.getById],
      id,
    )) as Collection;
    const { workersIds, collectionId } = (yield call(
      [collectionRepository, collectionRepository.delete],
      collectionToRemove,
    )) as { workersIds: string[]; collectionId: string };
    yield put(removeCollectionSuccess(collectionId));
    yield put(removeWorkersSuccess(workersIds)); //remove workers associated to the collection
    //A priori, plus besoin de prévenir le store, si on supprime une collection, c'est que l'on est sur la page des collections
    // yield put(removeAnnotationSuccess(collectionId));
    yield put(pushInfo(i18n.t('toast_collection_deleted')));
  } catch (e) {
    yield put(pushError(getErrorMessage(e)));
  }
}

/**
 * @remarks if some canvas are already in the collection, they will not be added again (but there is no error dispatched!)
 * @param action
 * @returns
 */
function* handleAddSelectionToCollection(
  action: PayloadAction<{ selection: Canvas[]; collectionId: string; manifestId: string }>,
): Generator<Effect, void, Collection> {
  const { selection, collectionId, manifestId } = action.payload;

  try {
    const collectionRepository = getCollectionRepository();
    const collection = yield call(
      [collectionRepository, collectionRepository.getById],
      collectionId,
    );
    //we check the existing content of the collection and add only the new canvases
    const existingContent = collection.content ?? [];
    const existingCanvasIds = existingContent.map((elt) => elt.canvasId);
    const newContent = generateCollectionContent(
      existingContent.length - 1,
      selection.map((canvas) => canvas.id),
      manifestId,
      existingCanvasIds,
    );
    const updatedCollection = {
      ...collection,
      contentSize: existingContent.length + newContent.length,
      content: [...existingContent, ...newContent],
    };
    yield call(
      [collectionRepository, collectionRepository.addContentToCollection],
      updatedCollection,
    );
    //Add first annotations for the new canvases
    const firstAnnotations = generateFirstAnnotation(selection, collectionId, existingCanvasIds);
    const annotationRepository = getAnnotationRepository();
    yield call([annotationRepository, annotationRepository.addAll], firstAnnotations);
    yield put(addSelectionToCollectionSuccess(updatedCollection));
    if (selection.length === 1) {
      yield put(pushInfo(i18n.t('toast_one_element_added')));
    } else if (selection.length > 1) {
      yield put(pushInfo(i18n.t('toast_multiple_elements_added', { count: selection.length })));
    }
  } catch (e) {
    yield put(pushError(getErrorMessage(e)));
  }
}

export interface CreateCollectionWithSelectionPayload {
  selection: Canvas[];
  name: string;
  id?: string;
  manifestId: string;
}

function* handleCreateCollectionWithSelection(
  action: PayloadAction<CreateCollectionWithSelectionPayload>,
): Generator<Effect, Collection, Collection | undefined> {
  const { id, name, selection, manifestId } = action.payload;
  const collectionId = id ?? uuid();
  const newCollection: CollectionDetails = {
    id: collectionId,
    name,
    tags: [],
    contentSize: selection.length,
    offline: false,
  };
  const content = generateCollectionContent(
    0,
    selection.map((c) => c.id),
    manifestId,
  );

  try {
    const collectionRepository = getCollectionRepository();
    yield call([collectionRepository, collectionRepository.create], {
      ...newCollection,
      content,
    });
    if (id === undefined) {
      //if an id was provided, it means it is an import, so we don't need to create the first annotations
      const firstAnnotations = generateFirstAnnotation(selection, collectionId);
      const annotationRepository = getAnnotationRepository();
      yield call([annotationRepository, annotationRepository.addAll], firstAnnotations);
    }
    yield put(createCollectionSuccess(newCollection));
    yield put(pushInfo(i18n.t('toast_collection_created')));
  } catch (e) {
    yield put(pushError(getErrorMessage(e)));
  }

  return { ...newCollection, content };
}

function* handleRemoveElementFromCollection(
  action: PayloadAction<{ collectionId: string; canvasId: string }>,
): Generator<Effect, void, Collection> {
  const { collectionId, canvasId } = action.payload;
  try {
    const collectionRepository = getCollectionRepository();
    const updatedCollection = yield call(
      [collectionRepository, collectionRepository.deleteElement],
      collectionId,
      canvasId,
    );
    yield put(removeElementFromCollectionSuccess(updatedCollection));
    yield put(pushInfo(i18n.t('toast_element_removed')));
  } catch (e) {
    yield put(pushError(getErrorMessage(e)));
  }
}

function* handleImportCollections(
  action: PayloadAction<ArrayBuffer>,
): Generator<Effect, void, JSZip | string> {
  const zip = new JSZip();
  const zipContent = (yield call(() => zip.loadAsync(action.payload))) as JSZip;
  for (const fileName in zipContent.files) {
    const file = zipContent.files[fileName];
    if (!file.dir) {
      const fileContent = (yield call(() => file.async('string'))) as string;
      try {
        const json = JSON.parse(fileContent) as object;
        yield call(handleImportCollection, {
          payload: json,
          type: importCollectionRequest.type,
        });
      } catch (e) {
        yield put(pushError(getErrorMessage(e)));
      }
    }
  }
}

function* handleImportCollection(
  _action: PayloadAction<object>,
): Generator<Effect, void, Collection> {
  const json = _action.payload;
  if ('type' in json && json.type !== 'Manifest') {
    yield put(pushError(i18n.t('error_import_not_a_manifest')));
    return;
  }
  const manifest = json as ExportedCollection;

  const items = manifest.items ?? [];
  if (items.length === 0) {
    yield put(pushError(i18n.t('info_empty_manifest')));
    return;
  }

  //save the manifest in indexedDB
  const manifestRepository = getManifestRepository();
  yield call([manifestRepository, manifestRepository.add], manifest);

  const collectionName = manifest.label?.none?.[0] ?? 'Imported collection'; //TODO change default name
  const collectionId = uuid(); //TODO change default id

  console.log(`Importing ${collectionName} (${collectionId})`);

  //add the tags
  const tags = manifest.tags ?? [];
  const tagRepository = getTagRepository();
  yield call([tagRepository, tagRepository.addAll], tags);

  //add the canvas
  for (let i = 0; i < items.length; i++) {
    const canvas = items[i];
    //import annotations
    const annotationPages = canvas.annotations;
    if (annotationPages !== undefined) {
      for (let j = 0; j < annotationPages.length; j++) {
        const annotationPage = annotationPages[j];
        if (annotationPage.id.endsWith('.json')) {
          continue; //TODO: handle json files
        } else {
          yield call(importAnnotationFromJson, annotationPage, collectionId);
        }
      }
    }
  }

  const result: Collection = yield* handleCreateCollectionWithSelection({
    payload: {
      selection: items,
      name: collectionName,
      id: collectionId,
      manifestId: manifest.id,
    },
    type: 'handleCreateCollectionWithSelection',
  });
  const newCollection = result as unknown as Collection;
  if (newCollection.id === undefined) {
    yield put(pushError(i18n.t('error_collection_not_found')));
    return;
  }
  const collectionRepository = getCollectionRepository();
  yield call(
    [collectionRepository, collectionRepository.updateTags],
    newCollection.id,
    tags.map((tag) => tag.id),
  );
  yield put(updateCollectionSuccess({ ...newCollection, tags: tags.map((tag) => tag.id) }));
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
        [ElementType.LINE],
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
    yield put(updateCollectionSuccess({ ...collection, offline: !collection.offline }));
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
  yield takeEvery(createCollectionRequest, handleCreateCollection);
  yield takeEvery(removeCollectionRequest, handleRemoveCollection);
  yield takeEvery(createCollectionWithSelectionRequest, handleCreateCollectionWithSelection);
  yield takeEvery(addSelectionToCollectionRequest, handleAddSelectionToCollection);
  yield takeEvery(removeElementFromCollectionRequest, handleRemoveElementFromCollection);
  yield takeEvery(updateCollectionRequest, handleUpdateCollection);
  yield takeEvery(importCollectionRequest, handleImportCollection);
  yield takeEvery(importCollectionsRequest, handleImportCollections);
  yield takeEvery(loadCollectionRequest, handleLoadCollection);
  yield takeEvery(toggleCollectionOfflineRequest, handleToggleCollectionOffline);
  yield takeEvery(exportCollectionsRequest, handleExportMultipleCollectionsRequest);
}

export {
  fetchAllCollections,
  handleAddSelectionToCollection,
  handleCreateCollection,
  handleCreateCollectionWithSelection,
  handleImportCollection,
  handleImportCollections,
  handleLoadCollection,
  handleRemoveCollection,
  handleRemoveElementFromCollection,
  handleUpdateCollection,
};
