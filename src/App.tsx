import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';
import ManifestViewer from './components/ManifestViewer';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ManifestViewer />
    </QueryClientProvider>
  );
}

export default App;
