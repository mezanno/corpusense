import { db } from '@/data/db';
import { History } from '@/data/models/history';
import { convertJsonToManifest } from '@/utils/manifest';
import { getErrorMessage } from '@/utils/utils';
import { Manifest } from '@iiif/presentation-3';
import { call, Effect, put, takeLatest } from 'redux-saga/effects';
import {
  fetchManifestError,
  fetchManifestRequest,
  fetchManifestSuccess,
  historyUpdated,
  setHistory,
} from '../reducers/manifests';

const fetchJson = async (url: string): Promise<Manifest> => {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch manifest ${response.statusText}`);
  }
  //TODO! gérer cas où ce n'est pas un objet (unknown)
  const data: object = (await response.json()) as object;

  if ('@context' in data && data['@context'] === 'http://iiif.io/api/presentation/3/context.json') {
    return data as Manifest;
  }

  return convertJsonToManifest(data);
};

function* handleFetchManifest(action: { payload: string }): Generator<Effect, void, Manifest> {
  const manifestUrl = action.payload;
  try {
    const data: Manifest = yield call(fetchJson, manifestUrl);

    yield put(fetchManifestSuccess(data));

    try {
      const addedHistory: History = { url: manifestUrl };
      yield call(() => db.history.add(addedHistory));
      yield put(historyUpdated(addedHistory));
    } catch (error) {
      console.warn('Error saving history to indexedDB', error);
    }
  } catch (error) {
    yield put(fetchManifestError(getErrorMessage(error)));
  }
}

// Saga pour charger les bookmarks depuis localStorage
function* loadHistorySaga(): Generator<Effect, void, History[]> {
  try {
    const history: History[] = yield call(() => db.history.toArray());

    yield put({ type: setHistory.type, payload: history });
  } catch (e) {
    console.warn('Error loading lists from indexedDB', e);
  }
}

export default function* viewerSaga() {
  yield takeLatest(fetchManifestRequest, handleFetchManifest);
}

export { loadHistorySaga };
