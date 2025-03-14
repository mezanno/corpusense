import { combineReducers, configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import annotationsReducer from './reducers/annotations';
import canvasReducer from './reducers/canvas';
import exportReducer from './reducers/export';
import listReducer from './reducers/lists';
import manifestsReducer from './reducers/manifests';
import navigationReducer from './reducers/navigation';
import selectionReducer from './reducers/selection';
import storedItemsReducer from './reducers/storedItems';
import tagsReducer from './reducers/tags';
import getRootSaga from './sagas';

const sagaMiddleware = createSagaMiddleware();

export const rootReducer = combineReducers({
  manifests: manifestsReducer,
  selection: selectionReducer,
  lists: listReducer,
  canvases: canvasReducer,
  storedItems: storedItemsReducer,
  navigation: navigationReducer,
  tags: tagsReducer,
  export: exportReducer,
  annotations: annotationsReducer,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(getRootSaga());

//TypeScript stuff
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
