import { combineReducers, configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import canvasReducer from './reducers/canvas';
import listReducer from './reducers/lists';
import manifestsReducer from './reducers/manifests';
import selectionReducer from './reducers/selection';
import storedElementsReducer from './reducers/storedElements';
import getRootSaga from './sagas';

const sagaMiddleware = createSagaMiddleware();

export const rootReducer = combineReducers({
  manifests: manifestsReducer,
  selection: selectionReducer,
  lists: listReducer,
  canvases: canvasReducer,
  storedElements: storedElementsReducer,
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
