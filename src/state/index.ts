import { Action, combineReducers, Reducer } from '@reduxjs/toolkit';
import annotationsReducer from './reducers/annotations';
import authReducer from './reducers/auth';
import collectionsReducer from './reducers/collections';
import eventsReducer from './reducers/events';
import exportReducer from './reducers/export';
import manifestsReducer from './reducers/manifests';
import modelsReducer from './reducers/models';
import entityReducer from './reducers/namedEntities';
import tagsReducer from './reducers/tags';
import workersReducer from './reducers/workers';

export const appReducer = combineReducers({
  manifests: manifestsReducer,
  collections: collectionsReducer,
  tags: tagsReducer,
  export: exportReducer,
  annotations: annotationsReducer,
  workers: workersReducer,
  models: modelsReducer,
  entities: entityReducer,
  events: eventsReducer,
  auth: authReducer,
});

export type AppState = ReturnType<typeof appReducer>;

export const rootReducer: Reducer<AppState, Action<string>> = (state, action) => {
  if (action.type === 'RESET_STORE') {
    state = undefined as unknown as AppState;
  }
  return appReducer(state, action);
};
