import { db } from '@/data/db';
import { History } from '@/data/models/History';
import { ItemMetadata, ItemMetadataAttribute } from '@/data/models/Metadata';
import { StoredItem } from '@/data/models/StoredItem';
import { fetchJson } from '@/data/services/manifest';
import { convertJsonToManifest } from '@/utils/manifest';
import { getErrorMessage } from '@/utils/utils';
import { Manifest } from '@iiif/presentation-3';
import { call, Effect, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import {
  fetchManifestError,
  fetchManifestFromArkRequest,
  fetchManifestFromContentRequest,
  fetchManifestFromUrlRequest,
  fetchManifestSuccess,
  historyUpdated,
  saveMetadaRequest,
  saveMetadaSuccess,
  setHistory,
} from '../reducers/manifests';
import { getManifestURL } from '../selectors/manifests';

//localhost:5173/corpusense?manifest=

function* handleFetchManifestFromURL(action: {
  payload: string;
}): Generator<Effect, void, StoredItem | undefined> {
  const url = action.payload;
  const item = yield call(() => db.storedItems.get(url));

  if (item === undefined) {
    yield call(() => handleFetchManifest({ fetchFunction: () => fetchJson(url) }));
  } else {
    yield call(() => handleFetchManifest({ storedManifest: item.content as Manifest }));
  }
}

function* handleFetchManifestFromArk(action: { payload: string }) {
  const url = `https://gallica.bnf.fr/iiif/ark:/12148/${action.payload}/manifest.json`;
  yield handleFetchManifest({ fetchFunction: () => fetchJson(url) });
}

function* handleFetchManifestFromContent(action: { payload: string }) {
  yield handleFetchManifest({ fetchFunction: () => JSON.parse(action.payload) as object });
}

function* handleFetchManifest({
  fetchFunction,
  storedManifest,
}: {
  fetchFunction?: () => Promise<object> | object;
  storedManifest?: Manifest;
}): Generator<Effect, void, Manifest | ItemMetadata[]> {
  try {
    let manifest: Manifest;
    if (fetchFunction) {
      const data = yield call(fetchFunction);
      if (
        '@context' in data &&
        data['@context'] === 'http://iiif.io/api/presentation/3/context.json'
      ) {
        manifest = data;
      } else {
        manifest = convertJsonToManifest(data);
      }
    } else if (storedManifest !== undefined) {
      manifest = storedManifest;
    } else {
      yield put(fetchManifestError(getErrorMessage('handleFetchManifest error')));
      return;
    }

    //load the metadata
    const fetchedMetadata = yield call(() => db.itemMetadata.where({ id: manifest.id }).toArray());
    const itemMetadata = (fetchedMetadata as ItemMetadata[]) ?? [];

    yield put(
      fetchManifestSuccess({
        content: manifest,
        metadata: itemMetadata?.map((item) => item.attribute) ?? [],
      }),
    );

    if (storedManifest === undefined) {
      try {
        yield call(() => db.storedItems.add({ id: manifest.id, content: manifest }));
      } catch (error) {
        console.warn('Error saving manifest to indexedDB', error);
      }
    }

    try {
      const addedHistory: History = { url: manifest.id };
      yield call(() => db.history.add(addedHistory));
      yield put(historyUpdated(addedHistory));
    } catch (error) {
      console.warn('Error adding url to indexedDB history: ', error);
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
    console.warn('Error loading history from indexedDB', e);
  }
}

function* saveMetadaHandler({
  payload,
}: {
  payload: ItemMetadataAttribute[];
}): Generator<Effect, void, string | null> {
  const manifestId = yield select(getManifestURL);

  if (manifestId !== null) {
    const manifestMetadata: ItemMetadata[] = payload.map((item) => ({
      id: manifestId,
      attribute: item,
    }));
    yield call(() => db.itemMetadata.bulkPut(manifestMetadata));
    yield put(saveMetadaSuccess(payload));
  }
}

export default function* viewerSaga() {
  yield takeLatest(fetchManifestFromContentRequest, handleFetchManifestFromContent);
  yield takeLatest(fetchManifestFromUrlRequest, handleFetchManifestFromURL);
  yield takeLatest(fetchManifestFromArkRequest, handleFetchManifestFromArk);
  yield takeEvery(saveMetadaRequest, saveMetadaHandler);
}

export { loadHistorySaga };
