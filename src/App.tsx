import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CorpusenseRoutes } from './hooks/useAppNavigation';
import CollectionInspectorPage from './pages/CollectionInspectorPage';
import CollectionsManagerPage from './pages/CollectionsManagerPage';
import ExportPage from './pages/ExportPage';
import Layout from './pages/Layout';
import ManifestExplorerPage from './pages/ManifestExplorerPage';
import TagsPage from './pages/TagsPage';

function App() {
  return (
    <BrowserRouter basename='/corpusense'>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ManifestExplorerPage />} />
          <Route path={CorpusenseRoutes.MANIFEST} element={<ManifestExplorerPage />} />
          <Route path={CorpusenseRoutes.COLLECTIONS} element={<CollectionsManagerPage />} />
          <Route
            path={`${CorpusenseRoutes.COLLECTIONS}/:collectionId`}
            element={<CollectionInspectorPage />}
          />
          <Route path='tags' element={<TagsPage />} />
          <Route path='export' element={<ExportPage />} />
          {/* <Route path='*' element={<div>Oups...</div>} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
