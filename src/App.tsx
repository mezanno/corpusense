import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import NavigationHandler from './hooks/NavigationHandler';
import ExportPage from './pages/ExportPage';
import Layout from './pages/Layout';
import ListInspectorPage from './pages/ListInspectorPage';
import ListsManagerPage from './pages/ListsManagerPage';
import ManifestExplorerPage from './pages/ManifestExplorerPage';
import TagsPage from './pages/TagsPage';

function App() {
  return (
    <BrowserRouter basename='/corpusense'>
      <NavigationHandler />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ManifestExplorerPage />} />
          <Route path='manifest' element={<ManifestExplorerPage />} />
          <Route path='lists' element={<ListsManagerPage />} />
          <Route path='list-inspector' element={<ListInspectorPage />} />
          <Route path='tags' element={<TagsPage />} />
          <Route path='export' element={<ExportPage />} />
          <Route path='*' element={<div>Oups...</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
