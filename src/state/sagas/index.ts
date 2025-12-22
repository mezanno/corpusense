import { all, call, fork, spawn } from 'redux-saga/effects';
import manifestsSaga from './manifests';
import workerSaga, { initWorkersStatus, loadWorkerPluginsInfo } from './workers';

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
    const coreSagas = [manifestsSaga, workerSaga];

    yield all(coreSagas.map((saga) => spawn(launchSaga, saga)));
    yield fork(initWorkersStatus); //load workers at startup
    yield fork(loadWorkerPluginsInfo);
  };
}

export default getRootSaga;
