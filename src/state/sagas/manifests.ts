import { db } from '@/data/db';
import { History } from '@/data/models/history';
import { convertJsonToManifest } from '@/utils/manifest';
import { getErrorMessage } from '@/utils/utils';
import { ManifestNormalized } from '@iiif/presentation-3-normalized';
import { put, takeLatest } from 'redux-saga/effects';
import {
  fetchManifest,
  fetchManifestError,
  fetchManifestSuccess,
  historyUpdated,
  setHistory,
} from '../reducers/manifests';

const fetchJson = async (url: string): Promise<ManifestNormalized> => {
  const response = await fetch(url);
  if (!response.ok) {
    //TODO: handle message
    throw new Error('URL not found');
  }
  const data: object = (await response.json()) as object;

  if (data['@context'] && data['@context'] === 'http://iiif.io/api/presentation/3/context.json') {
    return data as ManifestNormalized;
  }

  return convertJsonToManifest(data);
};

function* handleFetchManifest(action: { payload: string }) {
  const manifestUrl = action.payload;
  try {
    const data: ManifestNormalized = yield fetchJson(manifestUrl);

    yield put(fetchManifestSuccess(data));

    try {
      const addedHistory: History = { url: manifestUrl };
      yield db.history.add(addedHistory);
      yield put(historyUpdated(addedHistory));
    } catch (error) {
      console.warn('Error saving history to indexedDB', error);
    }
  } catch (error) {
    yield put(fetchManifestError(getErrorMessage(error)));
  }
}

// Saga pour charger les bookmarks depuis localStorage
function* loadHistorySaga() {
  try {
    const history: History[] = yield db.history.toArray();

    yield put({ type: setHistory.type, payload: history });
  } catch (e) {
    console.warn('Error loading lists from indexedDB', e);
  }
}

export default function* viewerSaga() {
  yield takeLatest(fetchManifest, handleFetchManifest);
}

export { loadHistorySaga };
