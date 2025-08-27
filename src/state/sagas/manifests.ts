import { importerPlugins } from '@/App';
import { History } from '@/data/models/History';
import { ItemMetadata, ItemMetadataAttribute } from '@/data/models/Metadata';
import { StoredManifestDetails } from '@/data/models/StoredManifest';
import {
  getItemMetadataRepository,
  getManifestRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import i18n from '@/i18n';
import { containsArkIdentifier, convertJsonToManifest, isManifestUrl } from '@/utils/manifest';
import { getErrorMessage } from '@/utils/utils';
import { Manifest } from '@iiif/presentation-3';
import { call, Effect, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { pushInfo } from '../reducers/events';
import {
  fecthManifestRequest,
  fetchManifestError,
  fetchManifestSuccess,
  removeFromHistoryRequest,
  removeFromHistorySuccess,
  SaveMetadataPayload,
  saveMetadataRequest,
  saveMetadataSuccess,
  setHistory,
} from '../reducers/manifests';

const keys = Object.keys(importerPlugins);

/**
 * Side effect to fetch a manifest from a URL. First, it checks if the manifest is already
 * stored in IndexedDB. If it is, it uses the stored manifest. If not, it fetches the manifest
 * from the URL.
 * @param action The action containing the URL of the manifest to fetch.
 */
function* handleFetchManifestFromURL(url: string): Generator<Effect, Manifest, Manifest> {
  console.log('handleFetchManifestFromURL ', url);

  try {
    const manifestRepository = getManifestRepository();
    //if the manifest is already stored in IndexedDB, we return it
    return yield call([manifestRepository, manifestRepository.getManifestById], url);
  } catch (error) {
    // If the manifest is not found in IndexedDB, we try to fetch it from the URL
    const importerKey = keys.find((key) => url.includes(key));
    const importer =
      importerKey !== undefined ? importerPlugins[importerKey] : importerPlugins['default'];
    if (importer !== undefined && importer !== null) {
      try {
        const manifest = yield call(fetchManifest, {
          fetchFunction: () => importer.import(url),
        });
        const manifestRepository = getManifestRepository();
        yield call([manifestRepository, manifestRepository.saveManifest], manifest);
        return manifest;
      } catch (err) {
        const msg = i18n.t('error_loading_manifest', { error: getErrorMessage(err) });
        yield put(fetchManifestError(msg));
      }
    }
    throw new Error(i18n.t('no_manifest_importer', { url }));
  }
}

function* handleFetchManifest(action: {
  payload: string;
}): Generator<Effect, void, Manifest | History> {
  console.log('handleFetchManifest ', action.payload);

  try {
    const manifestInput = action.payload;

    if (isManifestUrl(manifestInput) || containsArkIdentifier(manifestInput)) {
      let manifest: Manifest;
      if (isManifestUrl(manifestInput)) {
        manifest = (yield call(handleFetchManifestFromURL, manifestInput)) as Manifest;
      } else {
        //build the URL based on old Gallica API
        //TODO: il faudrait pouvoir s'adapter à d'autres ark que ceux de Gallica. Infos : https://arks.org/ark:/12148 https://n2t-dev.n2t.net/e/n2t_apidoc.html
        const url = `https://gallica.bnf.fr/iiif/${manifestInput}/manifest.json`;
        manifest = (yield call(handleFetchManifestFromURL, url)) as Manifest;
      }

      //load the metadata
      const manifestRepository = getManifestRepository();
      const result = yield call(
        [manifestRepository, manifestRepository.loadMetadataForManifest],
        manifest.id,
      );
      const metadata: ItemMetadataAttribute[] = Array.isArray(result) ? result : [];

      yield put(
        fetchManifestSuccess({
          content: manifest,
          metadata,
        }),
      );
      yield put(pushInfo(i18n.t('info_manifest_loaded')));

      //add the manifest to the history
      try {
        yield call([manifestRepository, manifestRepository.addToHistory], manifest.id);
      } catch (error) {
        console.warn('Error adding url to indexedDB history: ', error);
      }
    } else {
      // yield call(fetchManifest, { fetchFunction: () => JSON.parse(manifestInput) as object });
      yield put(fetchManifestError(i18n.t('error_loading_manifest')));
    }
  } catch (error) {
    const msg = i18n.t('error_loading_manifest', { error: getErrorMessage(error) });
    yield put(fetchManifestError(msg));
  }
}

/**
 * Side effect to fetch a manifest. It can either fetch the manifest from a URL or use
 * a stored manifest. It also fetches the metadata associated with the manifest.
 * @param fetchFunction: A function to fetch the manifest. If not provided, it uses the stored manifest.
 * @param storedManifest: The manifest to use if fetchFunction is not provided.
 */
function* fetchManifest({
  fetchFunction,
  storedManifest,
}: {
  fetchFunction?: () => Promise<object> | object;
  storedManifest?: Manifest;
}): Generator<Effect, Manifest, Manifest | ItemMetadataAttribute[] | History> {
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
    throw new Error(i18n.t('error_no_manifest_method'));
  }

  return manifest;
}

/**
 * Side effect to remove a manifest from the history. It deletes the manifest from IndexedDB.
 * @param action The action containing the URL of the manifest to remove from history.
 */
function* handleRemoveFromHistory(action: { payload: string }) {
  const url = action.payload;
  try {
    const manifestRepository = getManifestRepository();
    yield call([manifestRepository, manifestRepository.removeFromHistory], url);
    yield put(removeFromHistorySuccess(url));
  } catch (error) {
    console.warn('Error removing url from indexedDB history: ', error);
  }
}

/**
 * Side effect to load the history from IndexedDB. It fetches all the history items
 * and dispatches an action to set the history in the state.
 */
function* loadHistorySaga(): Generator<Effect, void, History[] | StoredManifestDetails[]> {
  try {
    const manifestRepository = getManifestRepository();
    const history = (yield call([manifestRepository, manifestRepository.getHistory])) as History[];
    const manifestDetails = (yield call(
      [manifestRepository, manifestRepository.getManifestDetailsByIds],
      history.map((item) => item.url),
    )) as StoredManifestDetails[];
    yield put(setHistory({ history, manifestDetails }));
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
  payload: SaveMetadataPayload;
}): Generator<Effect, void, string | null> {
  const { manifestId, metadata } = payload;

  if (manifestId !== null) {
    const manifestMetadata: ItemMetadata[] = metadata.map((item) => ({
      id: manifestId,
      attribute: item,
    }));
    const itemMetadataRepository = getItemMetadataRepository();
    yield call([itemMetadataRepository, itemMetadataRepository.addMetadata], manifestMetadata);
    yield put(saveMetadataSuccess(payload));
  }
}

export default function* viewerSaga() {
  yield takeLatest(fecthManifestRequest, handleFetchManifest);
  yield takeEvery(saveMetadataRequest, handleSaveMetadata);
  yield takeEvery(removeFromHistoryRequest, handleRemoveFromHistory);
}

export {
  handleFetchManifest,
  handleFetchManifestFromURL,
  handleRemoveFromHistory,
  handleSaveMetadata,
  loadHistorySaga,
};
