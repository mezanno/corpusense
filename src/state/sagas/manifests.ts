import { db } from '@/data/db';
import { History } from '@/data/models/History';
import { ItemMetadata, ItemMetadataAttribute } from '@/data/models/Metadata';
import { StoredItem } from '@/data/models/StoredItem';
import { CorpusenseRoutes } from '@/pages/Layout';
import { convertJsonToManifest } from '@/utils/manifest';
import { getErrorMessage } from '@/utils/utils';
import { Manifest } from '@iiif/presentation-3';
import { call, Effect, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import { reset } from '../reducers/canvas';
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
import { navigateTo } from '../reducers/navigation';
import { getManifestURL } from '../selectors/manifests';

//localhost:5173/corpusense?manifest=

const fetchJson = async (url: string): Promise<object> => {
  console.log('fetchJson: ', url);
  let fetchUrl = url;
  if (url.includes('gallica.bnf.fr')) {
    console.log('Gallica v1 detected');

    const urlV3 = url.replace('gallica.bnf.fr/iiif', 'openapi.bnf.fr/iiif/presentation/v3');
    const responseHead = await fetch(urlV3, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
    if (responseHead.ok) {
      console.info('using Gallica API v3: ', urlV3);
      fetchUrl = urlV3;
    } else {
      console.warn('Gallica API v3 not available, using proxy');

      fetchUrl = `http://localhost:3001/proxy?url=${encodeURIComponent(url)}`;
    }
  }
  const response = await fetch(fetchUrl, {
    // mode: 'no-cors', //ne sert à rien (renvoie 200 mais corps de la réponse vide)
    headers: {
      Accept: 'application/json',
      'Access-Control-Allow-Origin': '*',
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
    } else {
      manifest = storedManifest as Manifest;
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
    yield put(reset());
    yield put(navigateTo(`/${CorpusenseRoutes.MANIFEST}`));

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
    console.warn('Error loading lists from indexedDB', e);
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
