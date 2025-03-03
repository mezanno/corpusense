import { List } from '@/data/models/list';
import { SelectedCanvas } from '@/data/models/selectedCanvas';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, CallEffect, Effect, put, PutEffect, takeEvery } from 'redux-saga/effects';
import { v4 as uuid } from 'uuid';
import { db } from '../../data/db';
import {
  addListRequest,
  addListSuccess,
  addSelectionToListRequest,
  addSelectionToListSuccess,
  removeListRequest,
  removeListSuccess,
  setLists,
} from '../reducers/lists';

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
  const newList: List = { id: uuid(), name: payload };

  try {
    yield db.lists.add(newList);
    yield put(addListSuccess(newList));
  } catch (e) {
    console.log('error', e);
  }
}

function* removeListSaga(action: PayloadAction<string>) {
  const { payload } = action;
  try {
    yield db.lists.delete(payload);
    yield put(removeListSuccess(payload));
  } catch (e) {
    console.log('error', e);
  }
}

function* addSelectionToListSaga(
  action: PayloadAction<{ selection: SelectedCanvas[]; listId: string }>,
): Generator<Effect, void, List | undefined> {
  const { payload } = action;
  // const selectionToAdd = action.payload.selection.map((elt) => elt.canvas.id);
  try {
    const list: List | undefined = yield call(() => db.lists.get(payload.listId));
    if (list && list !== undefined) {
      if (list.content === null || list.content === undefined) {
        list.content = [];
      }
      //TODO! Vérifier si les éléments ne sont pas déjà dans la liste
      list.content = [...list.content, ...payload.selection];

      //TODO! vérifier si la jonction oneToMany est bien gérée
      yield call(() =>
        db.transaction('rw', db.storedElements, db.lists, async () => {
          //add the canvas ids to the list and add the canvases
          const canvasesToAdd = action.payload.selection.map((elt) => ({
            id: elt.canvas.id,
            content: elt.canvas,
          }));
          //on utilie bulkPut pour éviter les doublons et éviter une erreur si un doublon existe (avec bulkAdd, une erreur est levée au premier doublon rencontré)
          await db.storedElements.bulkPut(canvasesToAdd);
          await db.lists.put(list);
        }),
      );

      yield put(addSelectionToListSuccess(list));
    }
  } catch (e) {
    console.log('error', e);
  }
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
  yield takeEvery(addSelectionToListRequest, addSelectionToListSaga);
  // yield takeEvery(addSelectionToList.type, saveListsSaga);
  // yield takeEvery(removeSelectionFromList.type, saveListsSaga);
  // yield takeEvery(updateList.type, saveListsSaga);
}

export { loadListsSaga };
