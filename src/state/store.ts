import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import canvasReducer from './reducers/canvas';
import listReducer from './reducers/lists';
import manifestsReducer from './reducers/manifests';
import selectionReducer from './reducers/selection';
import getRootSaga from './sagas';

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
  reducer: {
    manifests: manifestsReducer,
    selection: selectionReducer,
    lists: listReducer,
    canvases: canvasReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(getRootSaga());

//TypeScript stuff
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
