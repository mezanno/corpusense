import { rootReducer, RootState } from '@/state/store';
import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import createSagaMiddleware from 'redux-saga';

// This function is used to render a component with the redux store and provider
export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = createMockStore(preloadedState),
    ...renderOptions
  }: { preloadedState?: Partial<RootState>; store?: ReturnType<typeof createMockStore> } = {},
) {
  return render(
    <Provider store={store}>
      <MemoryRouter>{ui}</MemoryRouter>{' '}
    </Provider>,
    renderOptions,
  );
}

export function createMockStore(preloadedState: Partial<RootState> = {}) {
  const sagaMiddleware = createSagaMiddleware(); //create the sage middleware but don't run it
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
    preloadedState,
  });
}
