import { all, call, fork, spawn } from 'redux-saga/effects';
import authSaga, { loadConnectedUser } from './auth';
import exportSaga from './export';
import manifestsSaga from './manifests';
import workerSaga, { fetchWorkers, loadWorkerPluginsInfo } from './workers';

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
    const coreSagas = [manifestsSaga, exportSaga, workerSaga, authSaga];

    yield all(coreSagas.map((saga) => spawn(launchSaga, saga)));
    yield fork(fetchWorkers); //load workers at startup
    yield fork(loadWorkerPluginsInfo);
    yield fork(loadConnectedUser); //load connected user at startup
  };
}

export default getRootSaga;
