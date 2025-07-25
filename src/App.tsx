import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CorpusenseRoutes } from './hooks/useAppNavigation';
import { initI18n } from './i18n';
import CollectionInspectorPage from './pages/CollectionInspectorPage';
import CollectionsManagerPage from './pages/CollectionsManagerPage';
import ConfigurationPage from './pages/ConfigurationPage';
import Layout from './pages/Layout';
import ManifestExplorerPage from './pages/ManifestExplorerPage';
import ModelsManagerPage from './pages/ModelsManagerPage';
import StoragePage from './pages/StoragePage';
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
  return (
    <BrowserRouter basename={basePath}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ManifestExplorerPage />} />
          <Route path={CorpusenseRoutes.MANIFEST} element={<ManifestExplorerPage />} />
          <Route path={CorpusenseRoutes.COLLECTIONS} element={<CollectionsManagerPage />} />
          <Route
            path={`${CorpusenseRoutes.COLLECTIONS}/:collectionId`}
            element={<CollectionInspectorPage />}
          />
          <Route path={CorpusenseRoutes.MODELS} element={<ModelsManagerPage />} />
          <Route path={CorpusenseRoutes.CONFIGURATION} element={<ConfigurationPage />} />
          <Route path={CorpusenseRoutes.STORAGE} element={<StoragePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
