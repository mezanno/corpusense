import { convertJsonToManifest } from '@/utils/manifest';
import { getErrorMessage } from '@/utils/utils';
import { ManifestNormalized } from '@iiif/presentation-3-normalized';
import { put, takeLatest } from 'redux-saga/effects';
import { fetchManifest, fetchManifestError, fetchManifestSuccess } from '../reducers/manifests';

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
  } catch (error) {
    yield put(fetchManifestError(getErrorMessage(error)));
  }
}

export default function* viewerSaga() {
  yield takeLatest(fetchManifest, handleFetchManifest);
}
