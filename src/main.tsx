import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App.tsx';
import i18n from './i18n';
import store from './state/store.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div>{i18n.t('info_loading')}</div>}>
      <Provider store={store}>
        <App />,
      </Provider>
    </Suspense>
  </StrictMode>,
);
