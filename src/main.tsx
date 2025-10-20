import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App.tsx';
import { initIndexedDBSync } from './data/repositories/indexeddb/dbSync.ts';
import './i18n';
import store from './state/store.ts';

initIndexedDBSync(store.getState, store.dispatch);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div>Loading...</div>}>
      <Provider store={store}>
        <App />,
      </Provider>
    </Suspense>
  </StrictMode>,
);
