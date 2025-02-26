import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import HomePAge from './pages/HomePage';
import Layout from './pages/Layout';
import ListsManagerPage from './pages/ListsManagerPage';
import ManifestExplorerPage from './pages/ManifestExplorerPage';
import { fetchManifestFromUrlRequest } from './state/reducers/manifests';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const manifestUrl = urlParams.get('manifest');
    if (manifestUrl != null) {
      dispatch(fetchManifestFromUrlRequest(manifestUrl));
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/corpusense' element={<Layout />}>
          <Route index element={<HomePAge />} />
          <Route path='manifest' element={<ManifestExplorerPage />} />
          <Route path='lists' element={<ListsManagerPage />} />
          <Route path='*' element={<HomePAge />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
