import { db } from '@/data/db';
import { History } from '@/data/models/history';
import { convertJsonToManifest } from '@/utils/manifest';
import { getErrorMessage } from '@/utils/utils';
import { Manifest } from '@iiif/presentation-3';
import { call, Effect, put, takeLatest } from 'redux-saga/effects';
import { reset } from '../reducers/canvas';
import {
  fetchManifestError,
  fetchManifestFromArkRequest,
  fetchManifestFromContentRequest,
  fetchManifestFromUrlRequest,
  fetchManifestSuccess,
  historyUpdated,
  setHistory,
} from '../reducers/manifests';
import { navigateTo } from '../reducers/navigation';

//localhost:5173/corpusense?manifest=

const fetchJson = async (url: string): Promise<object> => {
  const response = await fetch(`http://localhost:3001/proxy?url=${encodeURIComponent(url)}`, {
    headers: {
      Accept: 'application/json',
      'Access-Control-Allow-Origin': '*',
      // AccessControlAllowOrigin: '*',
    },
  });
  if (!response.ok) {
    console.log(response);

    throw new Error(`Failed to fetch manifest ${response.statusText}`);
  }
  //TODO! gérer cas où ce n'est pas un objet (unknown)
  const data: object = (await response.json()) as object;

  return data;
};

function* handleFetchManifestFromURL(action: { payload: string }) {
  yield handleFetchManifest(() => fetchJson(action.payload));
}

function* handleFetchManifestFromArk(action: { payload: string }) {
  const url = `https://gallica.bnf.fr/iiif/ark:/12148/${action.payload}/manifest.json`;
  yield handleFetchManifest(() => fetchJson(url));
}

function* handleFetchManifestFromContent(action: { payload: string }) {
  yield handleFetchManifest(() => JSON.parse(action.payload) as object);
}

function* handleFetchManifest(
  fetchFunction: () => Promise<object> | object,
): Generator<Effect, void, Manifest> {
  try {
    const data = yield call(fetchFunction);
    let manifest: Manifest;
    if (
      '@context' in data &&
      data['@context'] === 'http://iiif.io/api/presentation/3/context.json'
    ) {
      manifest = data;
    } else {
      manifest = convertJsonToManifest(data);
    }

    yield put(fetchManifestSuccess(manifest));
    yield put(reset());
    yield put(navigateTo('/corpusense/manifest'));
    try {
      yield call(() => db.storedElements.add({ id: manifest.id, content: manifest }));
    } catch (error) {
      console.warn('Error saving manifest to indexedDB', error);
    }

    try {
      const addedHistory: History = { url: manifest.id };
      yield call(() => db.history.add(addedHistory));
      yield put(historyUpdated(addedHistory));
    } catch (error) {
      console.warn('Error saving history to indexedDB', error);
    }
  } catch (error) {
    yield put(fetchManifestError(getErrorMessage(error)));
  }
}

// Saga pour charger les bookmarks depuis indexedDB
function* loadHistorySaga(): Generator<Effect, void, History[]> {
  try {
    const history: History[] = yield call(() => db.history.toArray());

    yield put({ type: setHistory.type, payload: history });
  } catch (e) {
    console.warn('Error loading lists from indexedDB', e);
  }
}

export default function* viewerSaga() {
  yield takeLatest(fetchManifestFromContentRequest, handleFetchManifestFromContent);
  yield takeLatest(fetchManifestFromUrlRequest, handleFetchManifestFromURL);
  yield takeLatest(fetchManifestFromArkRequest, handleFetchManifestFromArk);
}

export { loadHistorySaga };
