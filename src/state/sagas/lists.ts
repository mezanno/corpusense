import { ExportedCollection, List } from '@/data/models/List';
import { SelectedCanvas } from '@/data/models/SelectedCanvas';
import { CorpusenseRoutes } from '@/pages/Layout';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, CallEffect, Effect, put, PutEffect, takeEvery } from 'redux-saga/effects';
import { v4 as uuid } from 'uuid';
import { db } from '../../data/db';
import {
  addListRequest,
  addListSuccess,
  addSelectionToListRequest,
  addSelectionToListSuccess,
  createListWithSelectionRequest,
  importCollection,
  removeElementFromList,
  removeElementFromListSuccess,
  removeListRequest,
  removeListSuccess,
  setActiveList,
  setLists,
  updateListRequest,
  updateListSuccess,
} from '../reducers/lists';
import { navigateTo } from '../reducers/navigation';
import { loadStoredElements } from './storedItems';

function* loadListsSaga(): Generator<CallEffect<List[]> | PutEffect, void, List[]> {
  try {
    const lists: List[] = yield call(() => db.lists.toArray());

    yield put({ type: setLists.type, payload: lists });
  } catch (e) {
    console.warn('Error loading lists from indexedDB', e);
  }
}

function* addListSaga(action: PayloadAction<string>) {
  const { payload } = action;
  const newList: List = { id: uuid(), name: payload, tags: [] };

  try {
    yield db.lists.add(newList);
    yield put(addListSuccess(newList));
  } catch (e) {
    console.log('error', e);
  }
}

function* upadteListSaga(action: PayloadAction<List>) {
  const { payload } = action;
  try {
    yield db.lists.update(payload.id, {
      name: payload.name,
      tags: payload.tags,
      content: payload.content,
    });
    yield put(updateListSuccess(payload));
  } catch (e) {
    console.log('error', e);
  }
}

function* removeListSaga(action: PayloadAction<string>) {
  const { payload } = action;
  try {
    yield call(() =>
      db.transaction('rw', db.lists, async () => {
        await db.lists.delete(payload);
        // await db.listElements.where('listId').equals(payload).delete();
        //TODO il faudrait supprimer les storedItems qui ne sont plus utilisés
      }),
    );
    yield put(removeListSuccess(payload));
  } catch (e) {
    console.log('error', e);
  }
}

function* addSelectionToListSaga(
  action: PayloadAction<{ selection: SelectedCanvas[]; listId: string; manifestId: string }>,
): Generator<Effect, void, List | undefined> {
  const { payload } = action;
  // const selectionToAdd = action.payload.selection.map((elt) => elt.canvas.id);
  try {
    const list: List | undefined = yield call(() => db.lists.get(payload.listId));
    if (list && list !== undefined) {
      if (list.content === null || list.content === undefined) {
        list.content = [];
      }
      //TODO! A faire : vérifier si les éléments ne sont pas déjà dans la liste
      let lastPosition = list.content.length - 1;
      const newContent = payload.selection.map((elt) => ({
        canvasId: elt.canvas.id,
        listId: payload.listId,
        position: ++lastPosition,
        manifestId: payload.manifestId,
      }));
      console.log(newContent);

      list.content = [...list.content, ...newContent];

      yield call(() =>
        db.transaction('rw', db.storedItems, db.lists, async () => {
          // await db.listElements.bulkAdd(newContent);
          const canvasesToStore = action.payload.selection.map((elt) => ({
            id: elt.canvas.id,
            content: elt.canvas,
          }));
          //     //on utilie bulkPut pour éviter les doublons et éviter une erreur si un doublon existe (avec bulkAdd, une erreur est levée au premier doublon rencontré)
          await db.storedItems.bulkPut(canvasesToStore);
          await db.lists.put(list);
        }),
      );
      yield call(loadStoredElements);
      yield put(addSelectionToListSuccess(list));
    }
  } catch (e) {
    console.log('error', e);
  }
}

function* handleCreateListWithSelection(
  action: PayloadAction<{ selection: SelectedCanvas[]; name: string; manifestId: string }>,
): Generator<Effect, List, List | undefined> {
  console.log('start of handleCreateListWithSelection');
  const { payload } = action;
  const listId = uuid();
  const newList: List = { id: listId, name: payload.name, tags: [] };

  let lastPosition = 0;
  const newContent = payload.selection.map((elt) => ({
    canvasId: elt.canvas.id,
    listId: listId,
    position: ++lastPosition,
    manifestId: payload.manifestId,
  }));
  newList.content = newContent;

  try {
    yield call(() => db.lists.add(newList));

    yield call(() =>
      db.transaction('rw', db.storedItems, db.lists, async () => {
        // await db.listElements.bulkAdd(newContent);
        const canvasesToStore = action.payload.selection.map((elt) => ({
          id: elt.canvas.id,
          content: elt.canvas,
        }));
        //on utilie bulkPut pour éviter les doublons et éviter une erreur si un doublon existe (avec bulkAdd, une erreur est levée au premier doublon rencontré)
        await db.storedItems.bulkPut(canvasesToStore);
        await db.lists.put(newList);
      }),
    );

    yield call(loadStoredElements); //il faut appeler le saga pour mettre à jour le state
    console.log('end of handleCreateListWithSelection');

    yield put(addListSuccess(newList));
  } catch (e) {
    console.log('error', e);
  }

  return newList;
}

function* handleRemoveElementFromList(
  action: PayloadAction<{ listId: string; canvasId: string }>,
): Generator<Effect, void, List | undefined> {
  const { listId, canvasId } = action.payload;
  try {
    yield call(() =>
      db.transaction('rw', db.storedItems, db.lists, async () => {
        // await db.listElements
        //   .where({ listId: listId, canvasId: canvasId })
        //   .delete()
        //   .then(() => console.log('deleted'));
        //supprimer le storedItem si il n'est plus utilisé
        const list = await db.lists.get(listId);
        if (list !== undefined) {
          const savedElements = list.content?.filter((elt) => elt.canvasId !== canvasId);
          list.content = savedElements;
          await db.lists.put(list);
        }
      }),
    );
    const updatedList = yield call(() => db.lists.get(listId));
    if (updatedList !== undefined) {
      yield put(removeElementFromListSuccess(updatedList));
    }
  } catch (e) {
    console.log('error', e);
  }
}

function* handleSetActiveList(_action: PayloadAction<string>): Generator<Effect, void, void> {
  yield put(navigateTo(`/${CorpusenseRoutes.LIST_INSPECTOR}`));
}

function* handleImportCollection(_action: PayloadAction<object>): Generator<Effect, void, void> {
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
  }

  const result = yield call(handleCreateListWithSelection, {
    payload: {
      selection: selectedCanvas,
      name: collectionName,
      manifestId: manifest.id,
    },
    type: createListWithSelectionRequest.type,
  });
  const newList = result as unknown as List;

  yield call(() =>
    db.lists.update(newList.id, {
      tags: tags.map((tag) => tag.id),
    }),
  );
  yield put(updateListSuccess({ ...newList, tags: tags.map((tag) => tag.id) }));
}

// Saga pour sauvegarder les bookmarks dans localStorage
// function* saveListsSaga(action) {
// else if (type == addSelectionToList.type) {
//   const list = yield db.lists.get(payload.listId);
//   list.content = [...list.content, ...payload.selection];
//   yield db.lists.put(list);
// } else if (type == removeSelectionFromList.type) {
//   const list = yield db.lists.get(payload.listId);
//   list.content = list.content.filter((item) => !payload.idsToRemove.includes(item.id));
//   yield db.lists.put(list);
// } else if (type == updateList.type) {
//   const updatedList = payload.updatedList;
//   yield db.lists.update(updatedList.id, updatedList);
// }
// }

export default function* listsSaga() {
  yield takeEvery(addListRequest.type, addListSaga);
  yield takeEvery(removeListRequest.type, removeListSaga);
  yield takeEvery(createListWithSelectionRequest, handleCreateListWithSelection);
  yield takeEvery(addSelectionToListRequest, addSelectionToListSaga);
  yield takeEvery(removeElementFromList, handleRemoveElementFromList);
  yield takeEvery(setActiveList, handleSetActiveList);
  // yield takeEvery(addSelectionToList.type, saveListsSaga);
  // yield takeEvery(removeSelectionFromList.type, saveListsSaga);
  yield takeEvery(updateListRequest, upadteListSaga);
  yield takeEvery(importCollection, handleImportCollection);
}

export { loadListsSaga };
