import { Collection, CollectionDetails, ExportedCollection } from '@/data/models/Collection';
import {
  getAnnotationRepository,
  getCollectionRepository,
  getManifestRepository,
  getTagRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { generateFirstAnnotation, importAnnotationFromJson } from '@/data/utils/annotations';
import { generateCollectionContent } from '@/data/utils/collections';
import i18n from '@/i18n';
import { getErrorMessage } from '@/utils/utils';
import { Canvas } from '@iiif/presentation-3';
import { PayloadAction } from '@reduxjs/toolkit';
import JSZip from 'jszip';
import { uniq } from 'lodash';
import { call, CallEffect, Effect, put, PutEffect, takeEvery } from 'redux-saga/effects';
import { v4 as uuid } from 'uuid';
import { removeAllCollectionAnnotationsSuccess } from '../reducers/annotations';
import {
  addSelectionToCollectionRequest,
  addSelectionToCollectionSuccess,
  createCollectionRequest,
  createCollectionSuccess,
  createCollectionWithSelectionRequest,
  importMultipleCollectionsRequest,
  importOneCollectionRequest,
  loadCollectionRequest,
  loadCollectionSuccess,
  removeCollectionRequest,
  removeCollectionSuccess,
  removeElementFromCollectionRequest,
  removeElementFromCollectionSuccess,
  setCollections,
  updateCollectionRequest,
  updateCollectionSuccess,
} from '../reducers/collections';
import { pushError, pushInfo } from '../reducers/events';
import { handleFetchManifestFromURL } from './manifests';

function* fetchAllCollections(): Generator<
  CallEffect<CollectionDetails[]> | PutEffect,
  void,
  CollectionDetails[]
> {
  try {
    const collectionRepository = getCollectionRepository();
    const collections: CollectionDetails[] = yield call([
      collectionRepository,
      collectionRepository.getAll,
    ]);

    yield put(setCollections(collections));
  } catch (e) {
    console.warn('Error loading collections from indexedDB', e);
  }
}

function* handleCreateCollection(action: PayloadAction<string>) {
  const name = action.payload;
  const newCollection: Collection = { id: uuid(), name, tags: [], contentSize: 0, content: [] };

  try {
    const collectionRepository = getCollectionRepository();
    yield call([collectionRepository, collectionRepository.insertCollection], newCollection);
    yield put(createCollectionSuccess(newCollection));
    yield put(pushInfo(i18n.t('toast_collection_created')));
  } catch (e) {
    yield put(pushError(getErrorMessage(e)));
  }
}

function* handleUpdateCollection(action: PayloadAction<Collection>) {
  const { id, name, tags, content, modelId } = action.payload;
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
): Generator<Effect, void, Collection> {
  const collectionId = action.payload; //id of the collection to remove
  try {
    const collectionRepository = getCollectionRepository();
    const collectionToRemove = yield call(
      [collectionRepository, collectionRepository.getCollectionById],
      collectionId,
    );
    yield call([collectionRepository, collectionRepository.remove], collectionToRemove);
    yield put(removeCollectionSuccess(collectionId));
    yield put(removeAllCollectionAnnotationsSuccess(collectionId));
    // yield put(removeStoreItems)
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
      [collectionRepository, collectionRepository.getCollectionById],
      collectionId,
    );
    //we check the existing content of the collection and add only the new canvases
    const existingContent = collection.content ?? [];
    const existingCanvasIds = existingContent.map((elt) => elt.canvasId);
    const newContent = generateCollectionContent(
      existingContent.length - 1,
      selection.map((canvas) => canvas.id),
      collectionId,
      manifestId,
      existingCanvasIds,
    );
    const updatedCollection = {
      ...collection,
      contentSize: existingContent.length + newContent.length,
      content: [...existingContent, ...newContent],
    };
    yield call(
      [collectionRepository, collectionRepository.saveCollectionContent],
      updatedCollection,
    );
    //Add first annotations for the new canvases
    const firstAnnotations = generateFirstAnnotation(selection, collectionId, existingCanvasIds);
    const annotationRepository = getAnnotationRepository();
    yield call([annotationRepository, annotationRepository.saveAllAnnotations], firstAnnotations);
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
  };
  const content = generateCollectionContent(
    0,
    selection.map((c) => c.id),
    collectionId,
    manifestId,
  );

  try {
    const collectionRepository = getCollectionRepository();
    yield call([collectionRepository, collectionRepository.insertCollection], {
      ...newCollection,
      content,
    });
    if (id === undefined) {
      //if an id was provided, it means it is an import, so we don't need to create the first annotations
      const firstAnnotations = generateFirstAnnotation(selection, collectionId);
      const annotationRepository = getAnnotationRepository();
      yield call([annotationRepository, annotationRepository.saveAllAnnotations], firstAnnotations);
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
      [collectionRepository, collectionRepository.removeElement],
      collectionId,
      canvasId,
    );
    yield put(removeElementFromCollectionSuccess(updatedCollection));
    yield put(pushInfo(i18n.t('toast_element_removed')));
  } catch (e) {
    yield put(pushError(getErrorMessage(e)));
  }
}

function* handleImportMultipleCollections(
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
        yield call(handleImportOneCollection, {
          payload: json,
          type: importOneCollectionRequest.type,
        });
      } catch (e) {
        yield put(pushError(getErrorMessage(e)));
      }
    }
  }
}

function* handleImportOneCollection(
  _action: PayloadAction<object>,
): Generator<Effect, void, Collection> {
  const json = _action.payload;
  if ('type' in json && json.type !== 'Manifest') {
    console.log('not a manifest');
    return;
  }
  const manifest = json as ExportedCollection;

  const items = manifest.items ?? [];
  if (items.length === 0) {
    console.log('no items to import');
    return;
  }

  //save the manifest in indexedDB
  const manifestRepository = getManifestRepository();
  yield call([manifestRepository, manifestRepository.saveManifest], manifest);

  const collectionName = manifest.label?.none?.[0] ?? 'Imported collection'; //TODO change default name
  const collectionId = uuid(); //TODO change default id

  console.log(`Importing ${collectionName} (${collectionId})`);

  //add the tags
  const tags = manifest.tags ?? [];
  const tagRepository = getTagRepository();
  yield call([tagRepository, tagRepository.saveTags], tags);

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
): Generator<Effect, void, Collection | Canvas[]> {
  try {
    const collectionRepository = getCollectionRepository();

    //get the collection to load
    const collectionToLoad = (yield call(
      [collectionRepository, collectionRepository.getCollectionById],
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
      yield call(handleFetchManifestFromURL, manifestId);
    }

    const canvases: Canvas[] = (yield call(
      [collectionRepository, collectionRepository.getCanvasesByCollectionId],
      collectionToLoad.id,
    )) as Canvas[];
    yield put(loadCollectionSuccess({ collection: collectionToLoad, canvases }));

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

export default function* collectionsSaga() {
  yield takeEvery(createCollectionRequest, handleCreateCollection);
  yield takeEvery(removeCollectionRequest, handleRemoveCollection);
  yield takeEvery(createCollectionWithSelectionRequest, handleCreateCollectionWithSelection);
  yield takeEvery(addSelectionToCollectionRequest, handleAddSelectionToCollection);
  yield takeEvery(removeElementFromCollectionRequest, handleRemoveElementFromCollection);
  yield takeEvery(updateCollectionRequest, handleUpdateCollection);
  yield takeEvery(importOneCollectionRequest, handleImportOneCollection);
  yield takeEvery(importMultipleCollectionsRequest, handleImportMultipleCollections);
  yield takeEvery(loadCollectionRequest, handleLoadCollection);
}

export {
  fetchAllCollections,
  handleAddSelectionToCollection,
  handleCreateCollection,
  handleCreateCollectionWithSelection,
  handleImportMultipleCollections,
  handleImportOneCollection,
  handleLoadCollection,
  handleRemoveCollection,
  handleRemoveElementFromCollection,
  handleUpdateCollection,
};
