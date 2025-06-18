import { combineReducers, configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { dateConverterMiddleware } from './middlewares/dateConverterMiddleware';
import annotationsReducer from './reducers/annotations';
import canvasReducer from './reducers/canvas';
import collectionsReducer from './reducers/collections';
import eventsReducer from './reducers/events';
import exportReducer from './reducers/export';
import manifestsReducer from './reducers/manifests';
import modelsReducer from './reducers/models';
import entityReducer from './reducers/namedEntities';
import selectionReducer from './reducers/selection';
import storedItemsReducer from './reducers/storedItems';
import tagsReducer from './reducers/tags';
import workersReducer from './reducers/workers';
import getRootSaga from './sagas';

const sagaMiddleware = createSagaMiddleware();

export const rootReducer = combineReducers({
  manifests: manifestsReducer,
  selection: selectionReducer,
  collections: collectionsReducer,
  canvases: canvasReducer,
  storedItems: storedItemsReducer,
  tags: tagsReducer,
  export: exportReducer,
  annotations: annotationsReducer,
  workers: workersReducer,
  models: modelsReducer,
  entities: entityReducer,
  events: eventsReducer,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware).concat(dateConverterMiddleware),
  devTools: true,
});

sagaMiddleware.run(getRootSaga());

//TypeScript stuff
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
