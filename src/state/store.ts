import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import manifestsReducer from './reducers/manifests';
import selectionReducer from './reducers/selection';
import getRootSaga from './sagas';

const sagaMiddleware = createSagaMiddleware();

export default configureStore({
  reducer: {
    manifests: manifestsReducer,
    selection: selectionReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sagaMiddleware),
});

sagaMiddleware.run(getRootSaga());
