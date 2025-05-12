import { History } from '@/data/models/History';
import { ItemMetadataAttribute } from '@/data/models/Metadata';
import { Manifest } from '@iiif/presentation-3';
import reducer, {
  fetchManifestError,
  fetchManifestFromUrlRequest,
  fetchManifestSuccess,
  removeFromHistorySuccess,
  resetLastError,
  saveMetadataSuccess,
  setHistory,
  updateHistorySuccess,
} from '../manifests';

describe('manifests reducer', () => {
  const initialState = {
    isLoading: false,
    lastError: '',
    loadedData: null,
    history: [],
    isLoaded: false,
  };

  it('should handle fetchManifestFromUrlRequest', () => {
    const action = fetchManifestFromUrlRequest({ manifestId: '1' });
    const state = reducer(initialState, action);

    expect(state.isLoading).toBe(true);
    expect(state.lastError).toBe('');
    expect(state.loadedData).toBeNull();
  });

  it('should handle fetchManifestError', () => {
    const action = fetchManifestError('Error occurred');
    const state = reducer(initialState, action);

    expect(state.isLoading).toBe(false);
    expect(state.lastError).toBe('Error occurred');
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

  it('should handle updateHistorySuccess', () => {
    const historyItem: History = { url: 'http://example.com' };
    const action = updateHistorySuccess(historyItem);
    const state = reducer(initialState, action);

    expect(state.history).toContainEqual(historyItem);
  });

  it('should handle setHistory', () => {
    const history: History[] = [{ url: 'http://example1.com' }, { url: 'http://example2.com' }];
    const action = setHistory(history);
    const state = reducer(initialState, action);

    expect(state.history).toEqual(history);
  });

  it('should handle removeFromHistorySuccess', () => {
    const initialStateWithHistory = {
      ...initialState,
      history: [
        { url: 'http://example1.com', label: 'Example 1' },
        { url: 'http://example2.com', label: 'Example 2' },
      ],
    };
    const action = removeFromHistorySuccess('http://example1.com');
    const state = reducer(initialStateWithHistory, action);

    expect(state.history).toHaveLength(1);
    expect(state.history[0].url).toBe('http://example2.com');
  });

  it('should handle saveMetadataSuccess', () => {
    const initialStateWithLoadedData = {
      ...initialState,
      loadedData: { content: { id: 'manifest1', type: 'Manifest' }, metadata: [] },
    };
    const manifestId = 'manifest1';
    const metadata: ItemMetadataAttribute[] = [{ label: 'Title', value: 'Example Manifest' }];
    const action = saveMetadataSuccess({ manifestId, metadata });
    //@ts-expect-error initialStateWithLoadedData
    const state = reducer(initialStateWithLoadedData, action);

    expect(state.loadedData?.metadata).toEqual(metadata);
  });

  it('should handle resetLastError', () => {
    const initialStateWithError = {
      ...initialState,
      lastError: 'Error occurred',
    };
    const action = resetLastError();
    const state = reducer(initialStateWithError, action);

    expect(state.lastError).toBe('');
  });
});
