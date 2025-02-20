import { List } from '@/data/models/list';
import { PayloadAction } from '@reduxjs/toolkit';
import { put, takeEvery } from 'redux-saga/effects';
import { v4 as uuid } from 'uuid';
import { db } from '../../data/db';
import {
  addListRequest,
  addListSuccess,
  removeListRequest,
  removeListSuccess,
  setLists,
} from '../reducers/lists';

// Saga pour charger les bookmarks depuis localStorage
function* loadListsSaga() {
  try {
    const lists: List[] = yield db.lists.toArray();

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
  // yield takeEvery(addSelectionToList.type, saveListsSaga);
  // yield takeEvery(removeSelectionFromList.type, saveListsSaga);
  // yield takeEvery(updateList.type, saveListsSaga);
}

export { loadListsSaga };
