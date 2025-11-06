import { Tag } from '@/data/models/Tag';
import reducer, { createTagRequest, createTagSuccess, setTags } from '../tags';

describe('tags reducer', () => {
  const initialState = {
    values: [],
  };

  it('should handle setTags', () => {
    const tags: Tag[] = [
      { id: '1', label: 'Tag 1' },
      { id: '2', label: 'Tag 2' },
    ];
    const action = setTags(tags);
    const state = reducer(initialState, action);

    expect(state.values).toEqual(tags);
  });

  it('should handle createNewTagSuccess', () => {
    const newTag: Tag = { id: '3', label: 'Tag 3' };
    const action = createTagSuccess(newTag);
    const state = reducer(initialState, action);

    expect(state.values).toContainEqual(newTag);
  });

  it('should handle createNewTagRequest without modifying state', () => {
    const newTag: Tag = { id: '4', label: 'Tag 4' };
    const action = createTagRequest(newTag);
    const state = reducer(initialState, action);

    expect(state).toEqual(initialState);
  });
});
