import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AlertDialogProvider } from './components/reducers/AlertDialogContext';
import { CorpusenseRoutes } from './hooks/useAppNavigation';
import { ExperimentalProvider } from './hooks/useExperimental';
import useServiceWorker from './hooks/useServiceWorker';
import { initI18n } from './i18n';
import CollectionInspectorPage from './pages/CollectionInspectorPage';
import CollectionsManagerPage from './pages/CollectionsManagerPage';
import ConfigurationPage from './pages/ConfigurationPage';
import DocumentationPage from './pages/DocumentationPage';
import Home from './pages/Home';
import Layout from './pages/Layout';
import ManifestExplorerPage from './pages/ManifestExplorerPage';
import ModelsManagerPage from './pages/ModelsManagerPage';
import StoragePage from './pages/StoragePage';
import WorkersManagerPage from './pages/WorkersManagerPage';
import { ImporterPlugin, loadImporterPlugins } from './state/sagas/plugins/loader';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/strict-boolean-expressions
const basePath: string = import.meta.env.VITE_BASE_PATH || '/';
export let importerPlugins: Record<string, ImporterPlugin> = {};

initI18n()
  .then(() => {
    console.info('i18n initialized');
    importerPlugins = loadImporterPlugins(); // Load importer plugins after i18n initialization (if i18n is not loaded before, it will not be able to translate error messages)
  })
  .catch((error) => {
    console.error('Error initializing i18n:', error);
  });

function App() {
  useServiceWorker();

  return (
    <BrowserRouter basename={basePath}>
      <ExperimentalProvider>
        <AlertDialogProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path={CorpusenseRoutes.MANIFEST} element={<ManifestExplorerPage />} />
              <Route path={CorpusenseRoutes.COLLECTIONS} element={<CollectionsManagerPage />} />
              <Route
                path={`${CorpusenseRoutes.COLLECTIONS}/:collectionId`}
                element={<CollectionInspectorPage />}
              />
              <Route path={CorpusenseRoutes.MODELS} element={<ModelsManagerPage />} />
              <Route path={CorpusenseRoutes.CONFIGURATION} element={<ConfigurationPage />} />
              <Route path={CorpusenseRoutes.STORAGE} element={<StoragePage />} />
              <Route path={CorpusenseRoutes.WORKERS} element={<WorkersManagerPage />} />
              <Route
                path={`${CorpusenseRoutes.WORKERS}/:workerId`}
                element={<WorkersManagerPage />}
              />
              <Route path={`${CorpusenseRoutes.DOCUMENTATION}`} element={<DocumentationPage />} />
              <Route
                path={`${CorpusenseRoutes.DOCUMENTATION}/:page`}
                element={<DocumentationPage />}
              />
            </Route>
          </Routes>
        </AlertDialogProvider>
      </ExperimentalProvider>
    </BrowserRouter>
  );
}

export default App;
