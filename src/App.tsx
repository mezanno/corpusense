import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Layout from './pages/Layout';
import ListsManager from './pages/ListsManager';
import ManifestViewer from './pages/ManifestViewer';
import { fetchManifest } from './state/reducers/manifests';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const manifestUrl = urlParams.get('manifest');
    if (manifestUrl != null) {
      dispatch(fetchManifest(manifestUrl));
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/corpusense' element={<Layout />}>
          <Route index element={<Home />} />
          <Route path='manifest' element={<ManifestViewer />} />
          <Route path='lists' element={<ListsManager />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
