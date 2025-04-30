import { Annotation } from '@/data/models/Annotation';
import { Collection, ExportedCollection } from '@/data/models/Collection';
import { SelectedCanvas } from '@/data/models/SelectedCanvas';
import { StoredItem } from '@/data/models/StoredItem';
import {
  generateFirstAnnotation,
  getAnnotationsForCollection,
  importAnnotationFromJson,
  saveAllAnnotations,
} from '@/data/services/annotations';
import { generateCollectionContent, saveCollectionContent } from '@/data/services/collections';
import { getCanvass } from '@/data/services/manifest';
import { Canvas } from '@iiif/presentation-3';
import { PayloadAction } from '@reduxjs/toolkit';
import i18next from 'i18next';
import JSZip from 'jszip';
import {
  call,
  CallEffect,
  Effect,
  put,
  PutEffect,
  takeEvery,
  takeLatest,
} from 'redux-saga/effects';
import { v4 as uuid } from 'uuid';
import { db } from '../../data/db';
import { fetchAnnotationsSuccess } from '../reducers/annotations';
import {
  addCollectionToHistoryRequest,
  addSelectionToCollectionRequest,
  addSelectionToCollectionSuccess,
  createCollectionRequest,
  createCollectionSuccess,
  createCollectionWithSelectionRequest,
  importMultipleCollectionsRequest,
  importOneCollectionRequest,
  removeCollectionRequest,
  removeCollectionSuccess,
  removeElementFromCollectionRequest,
  removeElementFromCollectionSuccess,
  setCollections,
  setError,
  updateCollectionRequest,
  updateCollectionSuccess,
} from '../reducers/collections';
import { setStoredItems } from '../reducers/storedItems';
import { loadStoredElements } from './storedItems';

function* fetchAllCollections(): Generator<
  CallEffect<Collection[]> | PutEffect,
  void,
  Collection[]
> {
  try {
    const collections: Collection[] = yield call(() => db.collections.toArray());

    yield put({ type: setCollections.type, payload: collections });
  } catch (e) {
    console.warn('Error loading collections from indexedDB', e);
  }
}

function* handleCreateCollection(action: PayloadAction<string>) {
  const { payload } = action;
  const newCollection: Collection = { id: uuid(), name: payload, tags: [], content: [] };

  try {
    yield db.collections.add(newCollection);
    yield put(createCollectionSuccess(newCollection));
  } catch (e) {
    console.log('error', e);
    yield put(setError(e));
  }
}

function* handleUpdateCollection(action: PayloadAction<Collection>) {
  const { payload } = action;
  try {
    yield db.collections.update(payload.id, {
      name: payload.name,
      tags: payload.tags,
      content: payload.content,
    });
    yield put(updateCollectionSuccess(payload));
  } catch (e) {
    console.log('error', e);
    yield put(setError(e));
  }
}

/**

 * @param action id of the collection to remove
 */
function* handleRemoveCollection(
  action: PayloadAction<string>,
): Generator<Effect, void, Collection | undefined> {
  const { payload } = action; //id of the collection to remove
  try {
    const result = yield call(() => db.collections.get(payload));
    if (result === undefined) {
      yield put(setError(i18next.t('error_collection_not_found')));
      return;
    }

    yield call(() =>
      db.transaction('rw', db.collections, db.storedItems, async () => {
        //list the canvases to remove (to remove them from the storedItems)
        const canvasIds = result.content.map((elt) => elt.canvasId);
        await db.storedItems.bulkDelete(canvasIds);
        //remove the annotations related to the canvases (for this collection)
        //TODO!
        //remove the collection
        await db.collections.delete(payload);
      }),
    );
    yield put(removeCollectionSuccess(payload));
  } catch (e) {
    console.log('error', e);
    yield put(setError(e));
  }
}

/**
 * @remarks if some canvas are already in the collection, they will not be added again (but there is no error dispatched!)
 * @param action
 * @returns
 */
function* handleAddSelectionToCollection(
  action: PayloadAction<{ selection: SelectedCanvas[]; collectionId: string; manifestId: string }>,
): Generator<Effect, void, Collection | undefined> {
  const { payload } = action;
  const collection: Collection | undefined = yield call(() =>
    db.collections.get(payload.collectionId),
  );
  if (collection === undefined) {
    yield put(setError(i18next.t('error_collection_not_found')));
    return;
  }
  try {
    if (collection.content === null || collection.content === undefined) {
      collection.content = [];
    }
    const existingCanvasIds = collection.content.map((elt) => elt.canvasId);
    const newContent = generateCollectionContent(
      collection.content.length - 1,
      payload.selection,
      payload.collectionId,
      payload.manifestId,
      existingCanvasIds,
    );
    collection.content = [...collection.content, ...newContent];
    yield call(saveCollectionContent, collection, payload.selection);

    const firstAnnotations = generateFirstAnnotation(
      payload.selection,
      payload.collectionId,
      existingCanvasIds,
    );
    yield call(saveAllAnnotations, firstAnnotations);
    yield call(loadStoredElements); //TODO: ? est-ce nécessaire de tout recharger ?
    yield put(addSelectionToCollectionSuccess(collection));
  } catch (e) {
    console.log('error', e);
    yield put(setError(e));
  }
}

export interface CollectionWithSelectionPayload {
  selection: SelectedCanvas[];
  name: string;
  id?: string;
  manifestId: string;
}

function* handleCreateCollectionWithSelection(
  action: PayloadAction<CollectionWithSelectionPayload>,
): Generator<Effect, Collection, Collection | undefined> {
  const { id, name, selection, manifestId } = action.payload;
  const collectionId = id ?? uuid();
  const newCollection: Collection = { id: collectionId, name, tags: [], content: [] };
  newCollection.content = generateCollectionContent(0, selection, collectionId, manifestId);

  const firstAnnotations = generateFirstAnnotation(selection, collectionId);

  try {
    yield call(() => db.collections.add(newCollection));
    yield call(saveCollectionContent, newCollection, selection);
    yield call(saveAllAnnotations, firstAnnotations);
    yield call(loadStoredElements); //il faut appeler le saga pour mettre à jour le state //TODO: ? est-ce nécessaire de tout recharger ?
    yield put(createCollectionSuccess(newCollection));
  } catch (e) {
    console.log('error', e);
    yield put(setError(e));
  }

  return newCollection;
}

function* handleRemoveElementFromCollection(
  action: PayloadAction<{ collectionId: string; canvasId: string }>,
): Generator<Effect, void, Collection | undefined> {
  const { collectionId, canvasId } = action.payload;
  try {
    yield call(() =>
      db.transaction('rw', db.storedItems, db.collections, async () => {
        const collection = await db.collections.get(collectionId);
        if (collection === undefined) {
          put(setError(i18next.t('error_collection_not_found')));
          return;
        }
        //update the content of the collection
        const savedElements = collection.content?.filter((elt) => elt.canvasId !== canvasId);
        collection.content = savedElements;
        await db.collections.put(collection);
        //and remove the canvas from the storedItems
        await db.storedItems.delete(canvasId);
      }),
    );
    const updatedCollection = yield call(() => db.collections.get(collectionId));
    if (updatedCollection !== undefined) {
      yield put(removeElementFromCollectionSuccess(updatedCollection));
    }
  } catch (e) {
    console.log('error', e);
    yield put(setError(e));
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
        console.log('error', e);
        yield put(setError(e));
      }
    }
  }
}

function* handleImportOneCollection(_action: PayloadAction<object>): Generator<Effect, void, void> {
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

  const collectionName = manifest.label?.none?.[0] ?? 'Imported collection'; //TODO change default name
  const collectionId = uuid(); //TODO change default id

  console.log(`Importing ${collectionName} (${collectionId})`);

  //add the tags
  const tags = manifest.tags ?? [];
  yield call(() => db.tags.bulkPut(tags));

  const selectedCanvas = [];
  //add the canvas
  for (let i = 0; i < items.length; i++) {
    const canvas = items[i];
    const isCanvasStored = (yield call(() => db.storedItems.get(canvas.id))) !== undefined;
    if (!isCanvasStored) {
      yield call(() =>
        db.storedItems.add({
          id: canvas.id,
          content: canvas,
        }),
      );
    }
    selectedCanvas.push({
      canvas,
      index: i,
    });
    //import annotations
    const annotationPages = canvas.annotations;
    if (annotationPages !== undefined) {
      for (let j = 0; j < annotationPages.length; j++) {
        const annotationPage = annotationPages[j];
        if (annotationPage.id.endsWith('.json')) {
          continue;
        } else {
          yield call(importAnnotationFromJson, annotationPage, collectionId);
        }
      }
    }
  }

  const result = yield call(handleCreateCollectionWithSelection, {
    payload: {
      selection: selectedCanvas,
      name: collectionName,
      id: collectionId,
      manifestId: manifest.id,
    },
    type: createCollectionWithSelectionRequest.type,
  });
  const newCollection = result as unknown as Collection;

  yield call(() =>
    db.collections.update(newCollection.id, {
      tags: tags.map((tag) => tag.id),
    }),
  );
  yield put(updateCollectionSuccess({ ...newCollection, tags: tags.map((tag) => tag.id) }));
}

function* handleLoadCollection(
  action: PayloadAction<string>,
): Generator<Effect, void, Collection[] | StoredItem[] | Canvas | Annotation[]> {
  try {
    const collectionId = action.payload;
    //reload all the collections
    const collections = (yield call(() => db.collections.toArray())) as Collection[];
    yield put(setCollections(collections));

    //get the collection to load
    const collectionToLoad = collections.find((collection) => collection.id === collectionId);
    if (collectionToLoad === undefined) {
      yield put(setError(i18next.t('error_collection_not_found')));
      return;
    }

    //check if the canvas are already in the storedItems, if not add them to the storedItems
    const contentToLoad = collectionToLoad.content.map((elt) => ({
      canvasId: elt.canvasId,
      manifestId: elt.manifestId,
    }));
    const storedItems = (yield call(() => db.storedItems.toArray())) as StoredItem[];
    const storedCanvasIds = storedItems.map((elt) => elt.id);
    const contentToAdd = contentToLoad.filter((elt) => !storedCanvasIds.includes(elt.canvasId));
    if (contentToAdd.length > 0) {
      for (const content of contentToAdd) {
        const canvas = (yield call(getCanvass, content.manifestId, content.canvasId)) as Canvas;
        if (canvas !== undefined) {
          yield call(() =>
            db.storedItems.add({
              id: content.canvasId,
              content: canvas,
            }),
          );
        }
      }
      const newStoredItems = (yield call(() => db.storedItems.toArray())) as StoredItem[];
      yield put(setStoredItems(newStoredItems));
    }

    //load all the annotations of the collection
    const annotations = (yield call(getAnnotationsForCollection, collectionId)) as Annotation[];
    yield put(fetchAnnotationsSuccess(annotations));
  } catch (e) {
    console.log('error', e);
    yield put(setError(e));
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
  yield takeLatest(addCollectionToHistoryRequest, handleLoadCollection);
}

export { fetchAllCollections };
