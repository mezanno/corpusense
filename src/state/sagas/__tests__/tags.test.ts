import { Tag } from '@/data/models/Tag';
import * as dbFactory from '@/data/repositories/indexeddb/dbFactory';
import { TagRepository } from '@/data/repositories/indexeddb/types';
import { runSaga } from 'redux-saga';
import { vi } from 'vitest';
import { createTagRequest, createTagSuccess, setTags } from '../../reducers/tags';
import { fetchAllTags, handleCreateNewTag } from '../tags';

const mockTags: Tag[] = [
  { id: '1', label: 'Tag 1' },
  { id: '2', label: 'Tag 2' },
];
const mockGetAllTags = vi.fn().mockResolvedValue(mockTags);
const mockCreateTag = vi.fn().mockResolvedValue(1);
const mockRepository: Partial<TagRepository> = {
  getAll: mockGetAllTags,
  add: mockCreateTag,
};

describe('tags saga', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch all tags and dispatch setTags action', async () => {
    const dispatch = vi.fn();
    vi.spyOn(dbFactory, 'getTagRepository').mockReturnValue(mockRepository as TagRepository);
    await runSaga(
      {
        dispatch,
      },
      fetchAllTags,
    ).toPromise();
    expect(mockGetAllTags).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(setTags(mockTags));
  });

  it('should handle createNewTag and dispatch createNewTagSuccess action', async () => {
    const newTag: Tag = { id: '3', label: 'Tag 3' };
    const dispatch = vi.fn();
    vi.spyOn(dbFactory, 'getTagRepository').mockReturnValue(mockRepository as TagRepository);

    const action = { type: createTagRequest.type, payload: newTag };

    await runSaga(
      {
        dispatch,
      },
      handleCreateNewTag,
      action,
    ).toPromise();

    expect(mockCreateTag).toHaveBeenCalledWith(newTag);
    expect(dispatch).toHaveBeenCalledWith(createTagSuccess(newTag));
  });
});
