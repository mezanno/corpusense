import { ItemMetadataAttribute } from '@/data/models/Metadata';
import {
  getItemMetadataRepository,
  getManifestRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { removeFromHistorySuccess, saveMetadataSuccess } from '@/state/reducers/manifests';
import { expectSaga } from 'redux-saga-test-plan';
import { throwError } from 'redux-saga-test-plan/providers';
import { call } from 'redux-saga/effects';
import { Mock, vi } from 'vitest';
import { handleRemoveFromHistory, handleSaveMetadata } from '../manifests';

vi.mock('@/data/repositories/indexeddb/dbFactory', () => ({
  getManifestRepository: vi.fn(),
  getItemMetadataRepository: vi.fn(),
}));

describe('saga: manifests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadHistorySaga', () => {
    it('should load history from IndexedDB', () => {
      // const mockHistory: History[] = [{ url: 'First' } as History, { url: 'Second' } as History];
      // const mockRepository = {
      //   getHistory: vi.fn().mockResolvedValue(mockHistory),
      // };
      // (getManifestRepository as unknown as Mock).mockReturnValue(mockRepository);
      // return expectSaga(loadHistorySaga)
      //   .provide([[call([mockRepository, mockRepository.getHistory]), mockHistory]])
      //   .put(setHistory(mockHistory))
      //   .run();
    });
  });

  describe('handleRemoveFromHistory', () => {
    it('should remove an item from history', () => {
      const mockRepository = {
        removeFromHistory: vi.fn(),
      };
      (getManifestRepository as unknown as Mock).mockReturnValue(mockRepository);

      return expectSaga(handleRemoveFromHistory, { payload: 'First' })
        .provide([[call([mockRepository, mockRepository.removeFromHistory], 'First'), undefined]])
        .put(removeFromHistorySuccess('First'))
        .run();
    });

    it('should do nothing if the url does not exist', () => {
      const mockRepository = {
        removeFromHistory: vi.fn(),
      };
      (getManifestRepository as unknown as Mock).mockReturnValue(mockRepository);

      return expectSaga(handleRemoveFromHistory, { payload: 'Unknow' })
        .provide([
          [
            call([mockRepository, mockRepository.removeFromHistory], 'Unknow'),
            throwError(new Error()),
          ],
        ])
        .run()
        .then((result) => {
          expect(result.effects.put).toBeUndefined();
        });
    });
  });

  describe('handleFetchManifestFromArk', () => {
    // it('should load a manifest from a correct ark identifier', () => {
    //   const ark = 'btv1b10500000g';
    //   const expectedUrl = 'https://gallica.bnf.fr/iiif/ark:/12148/btv1b10500000g/manifest.json';
    //   return expectSaga(handleFetchManifestFromArk, { payload: ark })
    //     .call(handleFetchManifestFromURL, { payload: { manifestId: expectedUrl } })
    //     .run();
    // });
    // it('should dispatch an error action if the ark identifier is invalid', () => {
    //   const ark = 'invalidArkIdentifier!';
    //   return (
    //     expectSaga(handleFetchManifestFromArk, { payload: ark })
    //       // .put(fetchManifestError('error_ark_invalid'))
    //       .run()
    //   );
    // });
  });

  describe('handleFetchManifestFromURL', () => {
    // it('should load a manifest from a url and call handleFetchManifest with a storedManifest if it exists in indexeddb', () => {
    //   const storedManifest = manifest as unknown as Manifest;
    //   const mockManifestRepository = {
    //     getManifest: vi.fn().mockResolvedValue(manifest),
    //   };
    //   (getManifestRepository as unknown as Mock).mockReturnValue(mockManifestRepository);
    //   return expectSaga(handleFetchManifestFromURL, { payload: { manifestId: 'url' } })
    //     .provide([
    //       [
    //         call([mockManifestRepository, mockManifestRepository.getManifest], 'url'),
    //         storedManifest,
    //       ],
    //     ])
    //     .call(handleFetchManifest, { storedManifest: storedManifest })
    //     .run();
    // });
    // it('should load a manifest from a url and call handleFetchManifest with fetchJson if it does not exists in indexeddb', () => {
    //   const error = new Error('Manifest not found');
    //   const mockManifestRepository = {
    //     getManifest: vi.fn().mockImplementation(() => {
    //       throw error;
    //     }),
    //   };
    //   (getManifestRepository as unknown as Mock).mockReturnValue(mockManifestRepository);
    //   return expectSaga(handleFetchManifestFromURL, { payload: { manifestId: 'url' } })
    //     .provide([
    //       [
    //         call([mockManifestRepository, mockManifestRepository.getManifest], 'url'),
    //         throwError(error),
    //       ],
    //     ])
    //     .call.like({
    //       fn: handleFetchManifest,
    //       args: [
    //         //!TODO check args
    //         // {
    //         //   fetchFunction: expect.any(Function),
    //         // },
    //       ],
    //     })
    //     .run();
    // });
  });

  describe('handleSaveMetadata', () => {
    it('should add metadata to a manifest', () => {
      const mockItemMetadataRepository = {
        addMetadata: vi.fn(),
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
              [mockItemMetadataRepository, mockItemMetadataRepository.addMetadata],
              expectedMetadata,
            ),
            undefined,
          ],
        ])
        .call(
          [mockItemMetadataRepository, mockItemMetadataRepository.addMetadata],
          expectedMetadata,
        )
        .put(saveMetadataSuccess({ manifestId, metadata: items }))
        .run();
    });
  });
});
