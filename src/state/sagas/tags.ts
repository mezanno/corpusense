import { db } from '@/data/db';
import { Tag } from '@/data/models/Tag';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, CallEffect, Effect, put, PutEffect, takeEvery } from 'redux-saga/effects';
import { createNewTagRequest, createNewTagSuccess, setTags } from '../reducers/tags';

function* fetchAllTags(): Generator<CallEffect<Tag[]> | PutEffect, void, Tag[]> {
  try {
    const typesList: Tag[] = yield call(() => db.tags.toArray());

    yield put(setTags(typesList));
  } catch (e) {
    console.warn('Error loading typeslist from indexedDB', e);
  }
}

function* handleCreateNewTag(action: PayloadAction<Tag>): Generator<Effect, void, number> {
  try {
    const newTag = action.payload;
    yield call(() => db.tags.add(newTag));
    yield put(createNewTagSuccess(newTag));
  } catch (error) {
    console.error(error);
  }
}

export default function* tagsSaga() {
  yield takeEvery(createNewTagRequest, handleCreateNewTag);
}

export { fetchAllTags };
