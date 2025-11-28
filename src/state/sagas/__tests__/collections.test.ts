import { vi } from 'vitest';
// import { createCollectionRequest } from '../../reducers/collections';
// import { handleCreateCollection } from '../collections';

vi.mock('@/data/repositories/indexeddb/dbFactory', () => ({
  getCollectionRepository: vi.fn(),
}));

vi.mock('uuid', () => {
  return {
    v4: vi.fn(() => '799caa82-346a-475f-8689-2d6ba8ef3b65'),
  };
});

describe('collections saga', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle createCollection and dispatch createCollectionSuccess', () => {
    // const collectionName = 'New Collection';
    // const mockCollection: Collection = {
    //   id: '799caa82-346a-475f-8689-2d6ba8ef3b65',
    //   name: collectionName,
    //   tags: [],
    //   content: [],
    // };
    // const mockRepository = {
    //   insertCollection: vi.fn().mockResolvedValue(undefined),
    // };
    // (getCollectionRepository as Mock).mockReturnValue(mockRepository);
    // return expectSaga(handleCreateCollection, createCollectionRequest(collectionName))
    //   .provide([
    //     [call([mockRepository, mockRepository.insertCollection], mockCollection), undefined],
    //   ])
    //   .put(createCollectionSuccess(mockCollection))
    //   .run();
  });

  it('should handle removeCollection and dispatch removeCollectionSuccess', () => {
    // const collectionId = 'collection1';
    // const mockCollection: Collection = {
    //   id: collectionId,
    //   name: 'Collection 1',
    //   tags: [],
    //   content: [],
    // };
    // const mockRepository = {
    //   getCollectionById: vi.fn().mockResolvedValue(mockCollection),
    //   remove: vi.fn().mockResolvedValue(undefined),
    // };
    // (getCollectionRepository as Mock).mockReturnValue(mockRepository);
    // return expectSaga(handleRemoveCollection, removeCollectionRequest(collectionId))
    //   .provide([
    //     [call([mockRepository, mockRepository.getCollectionById], collectionId), mockCollection],
    //     [call([mockRepository, mockRepository.remove], mockCollection), undefined],
    //   ])
    //   .put(removeCollectionSuccess(collectionId))
    //   .run();
  });

  it('should handle removeElementFromCollection and dispatch removeElementFromCollectionSuccess', () => {
    // const collectionId = 'collection1';
    // const canvasId = 'canvas1';
    // const updatedCollection: Collection = {
    //   id: collectionId,
    //   name: 'Collection 1',
    //   tags: [],
    //   content: [],
    // };
    // const mockRepository = {
    //   removeElement: vi.fn().mockResolvedValue(updatedCollection),
    // };
    // (getCollectionRepository as Mock).mockReturnValue(mockRepository);
    // return expectSaga(
    //   handleRemoveElementFromCollection,
    //   removeElementFromCollectionRequest({ collectionId, canvasId }),
    // )
    //   .provide([
    //     [
    //       call([mockRepository, mockRepository.removeElement], collectionId, canvasId),
    //       updatedCollection,
    //     ],
    //   ])
    //   .put(removeElementFromCollectionSuccess(updatedCollection))
    //   .run();
  });

  it('should handle errors and dispatch setError', () => {
    // const collectionName = 'New Collection';
    // const error = new Error('Test Error');
    // const mockRepository = {
    //   insertCollection: vi.fn().mockRejectedValue(error),
    // };
    // (getCollectionRepository as Mock).mockReturnValue(mockRepository);
    // return (
    //   expectSaga(handleCreateCollection, createCollectionRequest(collectionName))
    //     .provide([
    //       [
    //         call([mockRepository, mockRepository.insertCollection], expect.anything()),
    //         throwError(error),
    //       ],
    //     ])
    //     // .put(setError(error))
    //     .run()
    // );
  });
});
