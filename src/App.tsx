import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CorpusenseRoutes } from './hooks/useAppNavigation';
import CollectionInspectorPage from './pages/CollectionInspectorPage';
import CollectionsManagerPage from './pages/CollectionsManagerPage';
import Layout from './pages/Layout';
import ManifestExplorerPage from './pages/ManifestExplorerPage';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/strict-boolean-expressions
const basePath: string = import.meta.env.VITE_BASE_PATH || '/';

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
          {/* <Route path='*' element={<div>Oups...</div>} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
