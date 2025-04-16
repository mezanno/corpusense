import { all, call, fork, spawn } from 'redux-saga/effects';
import annotationsSaga from './annotations';
import collectionsSaga, { fetchAllCollections } from './collections';
import exportSaga from './export';
import manifestsSaga, { loadHistorySaga } from './manifests';
import selectionSaga from './selection';
import { loadStoredElements } from './storedItems';
import tagsSaga, { fetchAllTags } from './tags';
import workerSaga from './workers';

function* launchSaga(saga: () => Generator) {
  while (true) {
    try {
      yield call(saga);
      break;
    } catch (e) {
      console.log(e);
    }
  }
}

function getRootSaga() {
  return function* rootSaga() {
    const sagas = [
      manifestsSaga,
      collectionsSaga,
      tagsSaga,
      selectionSaga,
      exportSaga,
      annotationsSaga,
      workerSaga,
    ];
    yield all(sagas.map((saga) => spawn(launchSaga, saga)));
    yield fork(fetchAllCollections); //load collections at startup
    yield fork(loadHistorySaga); //load history at startup
    yield fork(loadStoredElements); //load stored elements at startup
    yield fork(fetchAllTags); //load types list at startup
  };
}

export default getRootSaga;
