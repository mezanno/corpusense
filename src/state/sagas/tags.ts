import { Tag } from '@/data/models/Tag';
import { getTagRepository } from '@/data/repositories/indexeddb/dbFactory';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, CallEffect, Effect, put, PutEffect, takeEvery } from 'redux-saga/effects';
import { createTagRequest, createTagSuccess, setTags } from '../reducers/tags';

function* fetchAllTags(): Generator<CallEffect<Tag[]> | PutEffect, void, Tag[]> {
  try {
    const tagRepository = getTagRepository();
    const typesList: Tag[] = yield call([tagRepository, tagRepository.getAll]);

    yield put(setTags(typesList));
  } catch (e) {
    console.warn('Error loading typeslist from indexedDB', e);
  }
}

function* handleCreateNewTag(action: PayloadAction<Tag>): Generator<Effect, void, number> {
  try {
    const newTag = action.payload;
    const tagRepository = getTagRepository();
    yield call([tagRepository, tagRepository.add], newTag);
    yield put(createTagSuccess(newTag));
  } catch (error) {
    console.error(error);
  }
}

export default function* tagsSaga() {
  yield takeEvery(createTagRequest, handleCreateNewTag);
}

export { fetchAllTags, handleCreateNewTag };
