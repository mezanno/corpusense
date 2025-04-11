import { Collection, ExportedCollection } from '@/data/models/Collection';
import { SelectedCanvas } from '@/data/models/SelectedCanvas';
import { PayloadAction } from '@reduxjs/toolkit';
import JSZip from 'jszip';
import { call, CallEffect, Effect, put, PutEffect, takeEvery } from 'redux-saga/effects';
import { v4 as uuid } from 'uuid';
import { db } from '../../data/db';
import {
  addCollectionRequest,
  addCollectionSuccess,
  addSelectionToCollectionRequest,
  addSelectionToCollectionSuccess,
  createCollectionWithSelectionRequest,
  importMultipleCollections,
  importOneCollection,
  removeCollectionRequest,
  removeCollectionSuccess,
  removeElementFromCollection,
  removeElementFromCollectionSuccess,
  setCollections,
  updateCollectionRequest,
  updateCollectionSuccess,
} from '../reducers/collections';
import { importAnnotationFromJson } from './annotations';
import { loadStoredElements } from './storedItems';

function* loadCollectionsSaga(): Generator<
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

function* getCollectionById(id: string): Generator<CallEffect, Collection, Collection> {
  const result = yield call(() => db.collections.get(id));
  if (result === undefined) {
    throw new Error(`Collection with id ${id} not found`);
  }
  return result;
}

function* addCollectionSaga(action: PayloadAction<string>) {
  const { payload } = action;
  const newCollection: Collection = { id: uuid(), name: payload, tags: [] };

  try {
    yield db.collections.add(newCollection);
    yield put(addCollectionSuccess(newCollection));
  } catch (e) {
    console.log('error', e);
  }
}

function* upadteCollectionSaga(action: PayloadAction<Collection>) {
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
  }
}

function* removeCollectionSaga(action: PayloadAction<string>) {
  const { payload } = action;
  try {
    yield call(() =>
      db.transaction('rw', db.collections, async () => {
        await db.collections.delete(payload);
        // await db.listElements.where('listId').equals(payload).delete();
        //TODO il faudrait supprimer les storedItems qui ne sont plus utilisés
      }),
    );
    yield put(removeCollectionSuccess(payload));
  } catch (e) {
    console.log('error', e);
  }
}

function* addSelectionToCollectionSaga(
  action: PayloadAction<{ selection: SelectedCanvas[]; collectionId: string; manifestId: string }>,
): Generator<Effect, void, Collection | undefined> {
  const { payload } = action;
  // const selectionToAdd = action.payload.selection.map((elt) => elt.canvas.id);
  try {
    const collection: Collection | undefined = yield call(() =>
      db.collections.get(payload.collectionId),
    );
    if (collection && collection !== undefined) {
      if (collection.content === null || collection.content === undefined) {
        collection.content = [];
      }
      //TODO! A faire : vérifier si les éléments ne sont pas déjà dans la collection
      let lastPosition = collection.content.length - 1;
      const newContent = payload.selection.map((elt) => ({
        canvasId: elt.canvas.id,
        collectionId: payload.collectionId,
        position: ++lastPosition,
        manifestId: payload.manifestId,
      }));
      console.log(newContent);

      collection.content = [...collection.content, ...newContent];

      yield call(() =>
        db.transaction('rw', db.storedItems, db.collections, async () => {
          // await db.listElements.bulkAdd(newContent);
          const canvasesToStore = action.payload.selection.map((elt) => ({
            id: elt.canvas.id,
            content: elt.canvas,
          }));
          //     //on utilie bulkPut pour éviter les doublons et éviter une erreur si un doublon existe (avec bulkAdd, une erreur est levée au premier doublon rencontré)
          await db.storedItems.bulkPut(canvasesToStore);
          await db.collections.put(collection);
        }),
      );
      yield call(loadStoredElements);
      yield put(addSelectionToCollectionSuccess(collection));
    }
  } catch (e) {
    console.log('error', e);
  }
}

function* handleCreateCollectionWithSelection(
  action: PayloadAction<{ selection: SelectedCanvas[]; name: string; manifestId: string }>,
): Generator<Effect, Collection, Collection | undefined> {
  console.log('start of handleCreateCollectionWithSelection');
  const { payload } = action;
  const collectionId = uuid();
  const newCollection: Collection = { id: collectionId, name: payload.name, tags: [] };

  let lastPosition = 0;
  const newContent = payload.selection.map((elt) => ({
    canvasId: elt.canvas.id,
    collectionId: collectionId,
    position: ++lastPosition,
    manifestId: payload.manifestId,
  }));
  newCollection.content = newContent;

  try {
    yield call(() => db.collections.add(newCollection));

    yield call(() =>
      db.transaction('rw', db.storedItems, db.collections, async () => {
        // await db.listElements.bulkAdd(newContent);
        const canvasesToStore = action.payload.selection.map((elt) => ({
          id: elt.canvas.id,
          content: elt.canvas,
        }));
        //on utilie bulkPut pour éviter les doublons et éviter une erreur si un doublon existe (avec bulkAdd, une erreur est levée au premier doublon rencontré)
        await db.storedItems.bulkPut(canvasesToStore);
        await db.collections.put(newCollection);
      }),
    );

    yield call(loadStoredElements); //il faut appeler le saga pour mettre à jour le state
    console.log('end of handleCreateCollectionWithSelection');

    yield put(addCollectionSuccess(newCollection));
  } catch (e) {
    console.log('error', e);
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
        // await db.listElements
        //   .where({ listId: listId, canvasId: canvasId })
        //   .delete()
        //   .then(() => console.log('deleted'));
        //supprimer le storedItem si il n'est plus utilisé
        const collection = await db.collections.get(collectionId);
        if (collection !== undefined) {
          const savedElements = collection.content?.filter((elt) => elt.canvasId !== canvasId);
          collection.content = savedElements;
          await db.collections.put(collection);
        }
      }),
    );
    const updatedCollection = yield call(() => db.collections.get(collectionId));
    if (updatedCollection !== undefined) {
      yield put(removeElementFromCollectionSuccess(updatedCollection));
    }
  } catch (e) {
    console.log('error', e);
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
          type: importOneCollection.type,
        });
      } catch (e) {
        console.log('error', e);
      }
    }
  }
}

function* handleImportOneCollection(_action: PayloadAction<object>): Generator<Effect, void, void> {
  yield call(console.log, 'action.payload', _action.payload);
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
          yield call(importAnnotationFromJson, annotationPage);
        }
      }
    }
  }

  const result = yield call(handleCreateCollectionWithSelection, {
    payload: {
      selection: selectedCanvas,
      name: collectionName,
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

export default function* collectionsSaga() {
  yield takeEvery(addCollectionRequest.type, addCollectionSaga);
  yield takeEvery(removeCollectionRequest.type, removeCollectionSaga);
  yield takeEvery(createCollectionWithSelectionRequest, handleCreateCollectionWithSelection);
  yield takeEvery(addSelectionToCollectionRequest, addSelectionToCollectionSaga);
  yield takeEvery(removeElementFromCollection, handleRemoveElementFromCollection);
  yield takeEvery(updateCollectionRequest, upadteCollectionSaga);
  yield takeEvery(importOneCollection, handleImportOneCollection);
  yield takeEvery(importMultipleCollections, handleImportMultipleCollections);
}

export { getCollectionById, loadCollectionsSaga };
