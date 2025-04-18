import { db } from '@/data/db';
import { StoredItem } from '@/data/models/StoredItem';
import { call, Effect, put } from 'redux-saga/effects';
import { setStoredItems } from '../reducers/storedItems';

/**
 * Saga to load stored elements from IndexedDB and dispatch them to the store.
 */
function* loadStoredElements(): Generator<Effect, void, StoredItem[]> {
  try {
    const storedElements: StoredItem[] = yield call(() => db.storedItems.toArray());

    yield put({ type: setStoredItems.type, payload: storedElements });
  } catch (e) {
    console.warn('Error loading storedElements from indexedDB', e);
  }
}

export { loadStoredElements };
