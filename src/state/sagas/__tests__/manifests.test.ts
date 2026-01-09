import { ItemMetadataAttribute } from '@/data/models/Metadata';
import { getItemMetadataRepository } from '@/data/repositories/indexeddb/dbFactory';
import { saveMetadataSuccess } from '@/state/reducers/manifests';
import { expectSaga } from 'redux-saga-test-plan';
import { call } from 'redux-saga/effects';
import { Mock, vi } from 'vitest';
import { handleSaveMetadata } from '../manifests';

vi.mock('@/data/repositories/indexeddb/dbFactory', () => ({
  getManifestRepository: vi.fn(),
  getItemMetadataRepository: vi.fn(),
}));

vi.mock('@/App', () => ({
  importerPlugins: {
    default: {
      import: vi.fn(),
    },
  },
}));

describe('saga: manifests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });



  describe('handleSaveMetadata', () => {
    it('should add metadata to a manifest', () => {
      const mockItemMetadataRepository = {
        addAll: vi.fn(),
      };
      (getItemMetadataRepository as unknown as Mock).mockReturnValue(mockItemMetadataRepository);

      const manifestId = 'manifest-123';
      const items: ItemMetadataAttribute[] = [
        { label: 'title-1', value: 'value-1' },
        { label: 'title-2', value: 'value-2' },
      ];
      const payload = {
        manifestId,
        metadata: items,
      };

      const expectedMetadata = [
        { id: 'manifest-123', attribute: { label: 'title-1', value: 'value-1' } },
        { id: 'manifest-123', attribute: { label: 'title-2', value: 'value-2' } },
      ];

      return expectSaga(handleSaveMetadata, {
        payload,
      })
        .provide([
          [
            call(
              [mockItemMetadataRepository, mockItemMetadataRepository.addAll],
              expectedMetadata,
            ),
            undefined,
          ],
        ])
        .put(saveMetadataSuccess({ manifestId, metadata: items }))
        .run();
    });

  });
});
