import { History } from '@/data/models/History';
import { getManifestRepository } from '@/data/repositories/indexeddb/dbFactory';
import { setHistory } from '@/state/reducers/manifests';
import { expectSaga } from 'redux-saga-test-plan';
import { call } from 'redux-saga/effects';
import { Mock, vi } from 'vitest';
import { loadHistorySaga } from '../manifests';

vi.mock('@/data/repositories/indexeddb/dbFactory', () => ({
  getManifestRepository: vi.fn(),
}));

describe('saga: manifests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadHistorySaga', () => {
    it('should load history from IndexedDB', () => {
      const mockHistory: History[] = [{ url: 'First' } as History, { url: 'Second' } as History];

      const mockRepository = {
        getHistory: vi.fn().mockResolvedValue(mockHistory),
      };
      (getManifestRepository as unknown as Mock).mockReturnValue(mockRepository);

      return expectSaga(loadHistorySaga)
        .provide([[call([mockRepository, mockRepository.getHistory]), mockHistory]])
        .put(setHistory(mockHistory))
        .run();
    });
  });
});
