import { Action, combineReducers, Reducer } from '@reduxjs/toolkit';
import authReducer from './reducers/auth';
import eventsReducer from './reducers/events';
import exportReducer from './reducers/export';
import manifestsReducer from './reducers/manifests';
import workersReducer from './reducers/workers';

export const appReducer = combineReducers({
  manifests: manifestsReducer,
  export: exportReducer,
  workers: workersReducer,

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
