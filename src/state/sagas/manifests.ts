import { db } from '@/data/db';
import { History } from '@/data/models/History';
import { ItemMetadata, ItemMetadataAttribute } from '@/data/models/Metadata';
import { StoredItem } from '@/data/models/StoredItem';
import { fetchJson, loadMetadataForManifest } from '@/data/services/manifest';
import { convertJsonToManifest } from '@/utils/manifest';
import { getErrorMessage, onlyLettersAndNumbers } from '@/utils/utils';
import { Manifest } from '@iiif/presentation-3';
import i18next from 'i18next';
import { call, Effect, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import {
  fetchManifestError,
  fetchManifestFromArkRequest,
  fetchManifestFromContentRequest,
  fetchManifestFromUrlRequest,
  fetchManifestSuccess,
  removeFromHistoryRequest,
  removeFromHistorySuccess,
  saveMetadataRequest,
  saveMetadataSuccess,
  setHistory,
  updateHistorySuccess,
} from '../reducers/manifests';
import { getManifestURL } from '../selectors/manifests';

/**
 * Side effect to fetch a manifest from a URL. First, it checks if the manifest is already
 * stored in IndexedDB. If it is, it uses the stored manifest. If not, it fetches the manifest
 * from the URL.
 * @param action The action containing the URL of the manifest to fetch.
 */
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

/**
 * Side effect to fetch a manifest from an Ark reference. It constructs the URL using the Ark reference
 * and fetches the manifest from the URL.
 * @remarks If the Ark reference contains invalid characters, it dispatches an error action.
 * @param action The action containing the Ark reference to fetch the manifest from.
 */
function* handleFetchManifestFromArk(action: { payload: string }) {
  if (!onlyLettersAndNumbers(action.payload)) {
    yield put(fetchManifestError(i18next.t('error_ark_invalid')));
  }
  //build the URL based on old Gallica API
  const url = `https://gallica.bnf.fr/iiif/ark:/12148/${action.payload}/manifest.json`;
  yield handleFetchManifestFromURL({ payload: url });
}

/**
 * Side effect to fetch a manifest from the content of an action. It parses the content
 * and fetches the manifest from it.
 * @param action The action containing the manifest content to fetch.
 */
function* handleFetchManifestFromContent(action: { payload: string }) {
  yield handleFetchManifest({ fetchFunction: () => JSON.parse(action.payload) as object });
}

/**
 * Side effect to fetch a manifest. It can either fetch the manifest from a URL or use
 * a stored manifest. It also fetches the metadata associated with the manifest.
 * @param fetchFunction: A function to fetch the manifest. If not provided, it uses the stored manifest.
 * @param storedManifest: The manifest to use if fetchFunction is not provided.
 */
function* handleFetchManifest({
  fetchFunction,
  storedManifest,
}: {
  fetchFunction?: () => Promise<object> | object;
  storedManifest?: Manifest;
}): Generator<Effect, void, Manifest | ItemMetadataAttribute[]> {
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
      yield put(fetchManifestError(i18next.t('error_no_manifest_method')));
      return;
    }

    //load the metadata
    const result = yield call(loadMetadataForManifest, manifest.id);
    const metadata: ItemMetadataAttribute[] = Array.isArray(result) ? result : [];

    yield put(
      fetchManifestSuccess({
        content: manifest,
        metadata,
      }),
    );

    //save the manifest to indexedDB
    if (storedManifest === undefined) {
      try {
        yield call(() => db.storedItems.add({ id: manifest.id, content: manifest }));
      } catch (error) {
        console.warn('Error saving manifest to indexedDB', error);
      }
    }

    //add the manifest to the history

    const addedHistory: History = { url: manifest.id };
    try {
      yield call(() => db.history.add(addedHistory));
    } catch (error) {
      console.warn('Error adding url to indexedDB history: ', error);
    }
    yield put(updateHistorySuccess(addedHistory));
  } catch (error) {
    yield put(fetchManifestError(getErrorMessage(error)));
  }
}

/**
 * Side effect to remove a manifest from the history. It deletes the manifest from IndexedDB.
 * @param action The action containing the URL of the manifest to remove from history.
 */
function* handleRemoveFromHistory(action: { payload: string }) {
  const url = action.payload;
  try {
    yield call(() => db.history.delete(url));
    yield put(removeFromHistorySuccess(url));
  } catch (error) {
    console.warn('Error removing url from indexedDB history: ', error);
  }
}

/**
 * Side effect to load the history from IndexedDB. It fetches all the history items
 * and dispatches an action to set the history in the state.
 */
function* loadHistorySaga(): Generator<Effect, void, History[]> {
  try {
    const history: History[] = yield call(() => db.history.toArray());
    yield put({ type: setHistory.type, payload: history });
  } catch (e) {
    console.warn('Error loading history from indexedDB', e);
  }
}

/**
 * Side effect to save metadata for a manifest. It takes the metadata attributes
 * and saves them to IndexedDB. It also dispatches an action to update the state.
 * @remarks The manifest ID is obtained from the state. If the manifest ID is null,
 * the metadata is not saved.
 * @param payload The metadata attributes to save.
 */
function* handleSaveMetadata({
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
    yield put(saveMetadataSuccess(payload));
  }
}

export default function* viewerSaga() {
  yield takeLatest(fetchManifestFromContentRequest, handleFetchManifestFromContent);
  yield takeLatest(fetchManifestFromUrlRequest, handleFetchManifestFromURL);
  yield takeLatest(fetchManifestFromArkRequest, handleFetchManifestFromArk);
  yield takeEvery(saveMetadataRequest, handleSaveMetadata);
  yield takeEvery(removeFromHistoryRequest, handleRemoveFromHistory);
}

export { loadHistorySaga };
