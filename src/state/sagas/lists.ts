import { List } from '@/data/models/List';
import { SelectedCanvas } from '@/data/models/SelectedCanvas';
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
  setActiveList,
  setLists,
  updateListRequest,
  updateListSucess,
} from '../reducers/lists';
import { navigateTo } from '../reducers/navigation';

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

function* upadteListSaga(action: PayloadAction<List>) {
  const { payload } = action;
  try {
    yield db.lists.update(payload.id, payload);
    yield put(updateListSucess(payload));
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
      let lastPosition = list.content.length - 1;
      const newContent = payload.selection.map((elt) => ({
        canvasId: elt.canvas.id,
        listId: payload.listId,
        position: ++lastPosition,
      }));
      console.log(newContent);

      list.content = [...list.content, ...newContent];

      yield call(() =>
        db.transaction('rw', db.storedItems, db.lists, db.listElements, async () => {
          await db.listElements.bulkAdd(newContent);
          const canvasesToStore = action.payload.selection.map((elt) => ({
            id: elt.canvas.id,
            content: elt.canvas,
          }));
          //     //on utilie bulkPut pour éviter les doublons et éviter une erreur si un doublon existe (avec bulkAdd, une erreur est levée au premier doublon rencontré)
          await db.storedItems.bulkPut(canvasesToStore);
          await db.lists.put(list);
        }),
      );

      yield put(addSelectionToListSuccess(list));
    }
  } catch (e) {
    console.log('error', e);
  }
}

function* handleSetActiveList(_action: PayloadAction<string>): Generator<Effect, void, void> {
  yield put(navigateTo('/corpusense/list-inspector'));
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
  yield takeEvery(setActiveList, handleSetActiveList);
  // yield takeEvery(addSelectionToList.type, saveListsSaga);
  // yield takeEvery(removeSelectionFromList.type, saveListsSaga);
  yield takeEvery(updateListRequest, upadteListSaga);
}

export { loadListsSaga };
