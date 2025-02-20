import { all, call, spawn } from 'redux-saga/effects';
import manifestsSaga from './manifests';

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
    const sagas = [manifestsSaga];
    yield all(sagas.map((saga) => spawn(launchSaga, saga)));
  };
}

export default getRootSaga;
