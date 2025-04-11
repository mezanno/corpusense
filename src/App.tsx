import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
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
          <Route path='manifest' element={<ManifestExplorerPage />} />
          <Route path='collections' element={<CollectionsManagerPage />} />
          <Route path='collections/:collectionid' element={<CollectionInspectorPage />} />
          <Route path='tags' element={<TagsPage />} />
          <Route path='export' element={<ExportPage />} />
          <Route path='*' element={<div>Oups...</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
