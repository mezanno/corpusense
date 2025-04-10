import { db } from '@/data/db';
import { Tag } from '@/data/models/Tag';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, CallEffect, Effect, put, PutEffect, takeEvery } from 'redux-saga/effects';
import { addNewTag, newTagAdded, setTags } from '../reducers/tags';

function* loadTagsSaga(): Generator<CallEffect<Tag[]> | PutEffect, void, Tag[]> {
  try {
    const typesList: Tag[] = yield call(() => db.tags.toArray());

    yield put(setTags(typesList));
  } catch (e) {
    console.warn('Error loading typeslist from indexedDB', e);
  }
}

function* handleAddNewTag(action: PayloadAction<Tag>): Generator<Effect, void, number> {
  try {
    // const newTag = { id: uuid(), label: action.payload };
    const newTag = action.payload;
    yield call(() => db.tags.add(newTag));
    yield put(newTagAdded(newTag));
  } catch (error) {
    console.error(error);
  }
}

function* getTagsById(ids: string[]): Generator<CallEffect, Tag[], Tag[] | undefined> {
  if (ids?.length > 0) {
    const resultTags = yield call(() => db.tags.filter((tag) => ids.includes(tag.id)).toArray());
    if (resultTags !== undefined) {
      return resultTags;
    }
  }
  return [];
}

export default function* tagsSaga() {
  yield takeEvery(addNewTag.type, handleAddNewTag);
}

export { getTagsById, loadTagsSaga };
