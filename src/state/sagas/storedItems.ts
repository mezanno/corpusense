import { StoredItem } from '@/data/models/StoredItem';
import { getStoredItemRepository } from '@/data/repositories/indexeddb/dbFactory';
import { call, Effect, put } from 'redux-saga/effects';
import { setStoredItems } from '../reducers/storedItems';

/**
 * Saga to load stored elements from IndexedDB and dispatch them to the store.
 */
function* loadStoredElements(): Generator<Effect, void, StoredItem[]> {
  try {
    const storedItemRepository = getStoredItemRepository();
    const storedElements: StoredItem[] = yield call([
      storedItemRepository,
      storedItemRepository.getAll,
    ]);
    yield put(setStoredItems(storedElements));
  } catch (e) {
    console.warn('Error loading storedElements from indexedDB', e);
  }
}

export { loadStoredElements };
