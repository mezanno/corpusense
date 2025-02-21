import { all, call, fork, spawn } from 'redux-saga/effects';
import listsSaga, { loadListsSaga } from './lists';
import manifestsSaga, { loadHistorySaga } from './manifests';

function* launchSaga(saga) {
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
    const sagas = [manifestsSaga, listsSaga];
    yield all(sagas.map((saga) => spawn(launchSaga, saga)));
    yield fork(loadListsSaga); //load lists at startup
    yield fork(loadHistorySaga); //load history at startup
  };
}

export default getRootSaga;
