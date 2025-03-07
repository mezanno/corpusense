import { all, call, fork, spawn } from 'redux-saga/effects';
import listsSaga, { loadListsSaga } from './lists';
import manifestsSaga, { loadHistorySaga } from './manifests';
import selectionSaga from './selection';
import { loadStoredElements } from './storedItems';
import tagsSaga, { loadTagsSaga } from './tags';

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
    const sagas = [manifestsSaga, listsSaga, tagsSaga, selectionSaga];
    yield all(sagas.map((saga) => spawn(launchSaga, saga)));
    yield fork(loadListsSaga); //load lists at startup
    yield fork(loadHistorySaga); //load history at startup
    yield fork(loadStoredElements); //load stored elements at startup
    yield fork(loadTagsSaga); //load types list at startup
  };
}

export default getRootSaga;
