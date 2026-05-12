import { Action, combineReducers, Reducer } from '@reduxjs/toolkit';
import eventsReducer from './reducers/events';
import manifestsReducer from './reducers/manifests';
import workersReducer from './reducers/workers';

export const appReducer = combineReducers({
  manifests: manifestsReducer,
  workers: workersReducer,
  events: eventsReducer,
});

export type AppState = ReturnType<typeof appReducer>;

export const rootReducer: Reducer<AppState, Action<string>> = (state, action) => {
  if (action.type === 'RESET_STORE') {
    state = undefined as unknown as AppState;
  }
  return appReducer(state, action);
};
