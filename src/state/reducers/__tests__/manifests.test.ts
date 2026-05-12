import { ItemMetadataAttribute } from '@/data/models/Metadata';
import { Manifest } from '@iiif/presentation-3';
import reducer, {
  fecthManifestRequest,
  fetchManifestError,
  fetchManifestSuccess,
  manifestInitialState,
  saveMetadataSuccess,
} from '../manifests';

describe('manifests reducer', () => {
  const initialState = manifestInitialState;

  it('should handle fecthManifestRequest', () => {
    const action = fecthManifestRequest('1');
    const state = reducer(initialState, action);

    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
    expect(state.loadedData).toBeNull();
  });

  it('should handle fetchManifestError', () => {
    const action = fetchManifestError('Error occurred');
    const state = reducer(initialState, action);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Error occurred');
  });

  it('should handle fetchManifestSuccess', () => {
    const manifest: Manifest = { id: 'manifest1', type: 'Manifest' } as Manifest;
    const metadata: ItemMetadataAttribute[] = [];
    const action = fetchManifestSuccess({ content: manifest, metadata });
    const state = reducer(initialState, action);

    expect(state.isLoading).toBe(false);
    expect(state.isLoaded).toBe(true);
    expect(state.loadedData).toEqual({ content: manifest, metadata });
  });

  it('should handle saveMetadataSuccess', () => {
    const initialStateWithLoadedData = {
      ...initialState,
      loadedData: { content: { id: 'manifest1', type: 'Manifest' } as Manifest, metadata: [] },
    };
    const manifestId = 'manifest1';
    const metadata: ItemMetadataAttribute[] = [{ label: 'Title', value: 'Example Manifest' }];
    const action = saveMetadataSuccess({ manifestId, metadata });
    const state = reducer(initialStateWithLoadedData, action);

    expect(state.loadedData?.metadata).toEqual(metadata);
  });
});

