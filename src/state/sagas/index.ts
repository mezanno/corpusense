import { all, call, fork, spawn } from 'redux-saga/effects';
import authSaga, { loadConnectedUser } from './auth';
import collectionsSaga from './collections';
import exportSaga from './export';
import manifestsSaga, { loadHistorySaga } from './manifests';
import namedEntitiesSaga from './namedEntities';
import tagsSaga, { fetchAllTags } from './tags';
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
    const coreSagas = [
      manifestsSaga,
      collectionsSaga,
      tagsSaga,
      exportSaga,
      workerSaga,
      namedEntitiesSaga,
      authSaga,
    ];

    yield all(coreSagas.map((saga) => spawn(launchSaga, saga)));
    yield fork(loadHistorySaga); //load history at startup
    yield fork(fetchAllTags); //load types list at startup
    yield fork(fetchWorkers); //load workers at startup
    yield fork(loadWorkerPluginsInfo);
    yield fork(loadConnectedUser); //load connected user at startup
  };
}

export default getRootSaga;
