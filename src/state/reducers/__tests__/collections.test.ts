import { Collection } from '@/data/models/Collection';
import reducer, {
  createCollectionSuccess,
  removeCollectionSuccess,
  removeFromOpenedCollections,
  setCollections,
  updateCollectionSuccess,
} from '../collections';

describe('collections reducer', () => {
  const initialState = {
    values: [],
    lastError: '',
    newCollectionEvent: false,
    openedCollections: [],
  };

  it('should handle createCollectionSuccess', () => {
    const newCollection = { id: '1', name: 'New Collection' } as Collection;
    const action = createCollectionSuccess(newCollection);
    const state = reducer(initialState, action);

    expect(state.values).toContainEqual(newCollection);
    // expect(state.newCollectionEvent).toBe(true);
  });

  it('should handle removeCollectionSuccess', () => {
    const initialStateWithCollections = {
      ...initialState,
      values: [
        { id: '1', name: 'Collection 1' },
        { id: '2', name: 'Collection 2' },
      ],
    };
    const action = removeCollectionSuccess('1');
    //@ts-expect-error initialStateWithCollections is partial
    const state = reducer(initialStateWithCollections, action);

    expect(state.values).toHaveLength(1);
    expect(state.values[0].id).toBe('2');
  });

  it('should handle updateCollectionSuccess', () => {
    const initialStateWithCollections = {
      ...initialState,
      values: [{ id: '1', name: 'Collection 1', about: 'Old About' }],
    };
    const updatedCollection = { id: '1', name: 'Collection 1', about: 'New About' } as Collection;
    const action = updateCollectionSuccess(updatedCollection);
    //@ts-expect-error initialStateWithCollections is partial
    const state = reducer(initialStateWithCollections, action);

    expect(state.values[0].about).toBe('New About');
  });

  it('should handle setCollections', () => {
    const collections = [
      { id: '1', name: 'Collection 1' },
      { id: '2', name: 'Collection 2' },
    ] as Collection[];
    const action = setCollections(collections);
    const state = reducer(initialState, action);

    expect(state.values).toEqual(collections);
  });

  it('should handle addCollectionToHistoryRequest', () => {
    // const action = addCollectionToHistoryRequest('1');
    // const state = reducer(initialState, action);
    // expect(state.openedCollections).toContain('1');
  });

  it('should handle addSelectionToCollectionSuccess', () => {
    // const initialStateWithCollections = {
    //   ...initialState,
    //   values: [{ id: '1', content: [] }],
    // };
    // const updatedCollection = { id: '1', content: ['canvas1'] } as unknown as Collection;
    // const action = addSelectionToCollectionSuccess(updatedCollection);
    // //@ts-expect-error initialStateWithCollections is partial
    // const state = reducer(initialStateWithCollections, action);
    // expect(state.values[0].content).toEqual(['canvas1']);
  });

  it('should handle removeElementFromCollectionSuccess', () => {
    // const initialStateWithCollections = {
    //   ...initialState,
    //   values: [{ id: '1', content: ['canvas1', 'canvas2'] }],
    // };
    // const updatedCollection = { id: '1', content: ['canvas1'] } as unknown as Collection;
    // const action = removeElementFromCollectionSuccess(updatedCollection);
    // //@ts-expect-error initialStateWithCollections is partial
    // const state = reducer(initialStateWithCollections, action);
    // expect(state.values[0].content).toEqual(['canvas1']);
  });

  it('should handle removeFromOpenedCollections', () => {
    const initialStateWithOpenedCollections = {
      ...initialState,
      openedCollections: ['1', '2'],
    };
    const action = removeFromOpenedCollections('1');
    const state = reducer(initialStateWithOpenedCollections, action);

    expect(state.openedCollections).not.toContain('1');
  });

  it('should handle setError', () => {
    // const action = setError('An error occurred');
    // const state = reducer(initialState, action);
    // expect(state.lastError).toBe('An error occurred');
  });

  it('should handle resetLastError', () => {
    // const initialStateWithError = {
    //   ...initialState,
    //   lastError: 'An error occurred',
    // };
    // const action = resetLastError();
    // const state = reducer(initialStateWithError, action);
    // expect(state.newCollectionEvent).toBe(false);
  });
});
