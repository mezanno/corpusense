import reducer, {
  exportCollectionsRequest,
  exportTextOfCanvasRequest,
  exportTextOfCollectionRequest,
} from '../export';

describe('export reducer', () => {
  const initialState = {
    lastExportContent: null,
    lastExportDate: null,
    lastExportError: '',
    lastExportStatus: 'UNKNOWN',
  };

  it('should handle exportError', () => {
    // const errorMessage = 'An error occurred';
    // const action = exportError(errorMessage);
    // //@ts-expect-error initialState incompatible
    // const state = reducer(initialState, action);
    // expect(state.lastExportError).toBe(errorMessage);
    // expect(state.lastExportStatus).toBe('ERROR');
  });

  it('should handle exportMultipleCollectionsRequest', () => {
    const action = exportCollectionsRequest(['collection1', 'collection2']);
    //@ts-expect-error initialState incompatible
    const state = reducer(initialState, action);

    expect(state).toEqual(initialState);
  });

  it('should handle exportTextOfCollectionRequest', () => {
    const action = exportTextOfCollectionRequest('collection1');
    //@ts-expect-error initialState incompatible
    const state = reducer(initialState, action);

    expect(state).toEqual(initialState);
  });

  it('should handle exportTextOfCanvasRequest', () => {
    const action = exportTextOfCanvasRequest({ canvasId: 'canvas1', collectionId: 'collection1' });
    //@ts-expect-error initialState incompatible
    const state = reducer(initialState, action);

    expect(state).toEqual(initialState);
  });

  it('should handle resetAlert', () => {
    // const stateWithAlert = {
    //   ...initialState,
    //   lastExportDate: new Date(),
    //   lastExportStatus: 'OK',
    // };
    // const action = resetAlert();
    // //@ts-expect-error initialState incompatible
    // const state = reducer(stateWithAlert, action);
    // expect(state.lastExportDate).toBeNull();
    // expect(state.lastExportStatus).toBe('UNKNOWN');
  });
});
