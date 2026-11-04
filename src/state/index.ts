import { Action, combineReducers, Reducer } from '@reduxjs/toolkit';
import eventsReducer from './reducers/events';
import workersReducer from './reducers/workers';

const appReducer = combineReducers({
  workers: workersReducer,
  events: eventsReducer,
});

export type AppState = ReturnType<typeof appReducer>;

export const rootReducer: Reducer<AppState, Action<string>> = (state, action) => {
  if (action.type === 'RESET_STORE') {
    state = undefined;
  }
  return appReducer(state, action);
};
