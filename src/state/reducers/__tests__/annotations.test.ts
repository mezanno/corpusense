describe('annotations reducer', () => {
  // const initialState = {
  //   values: [],
  //   isLoading: false,
  //   deleted: {} as Annotation,
  //   updated: {} as Annotation,
  // };

  it('should handle saveAnnotationSuccess', () => {
    // const newAnnotation = { id: '1', canvasId: 'canvas1', collectionId: 'collection1' };
    // const action = saveAnnotationsSuccess([newAnnotation] as Annotation[]);
    // const state = reducer(initialState, action);
    // expect(state.values).toContainEqual(newAnnotation);
  });

  it('should handle removeAnnotationSuccess', () => {
    // const initialStateWithAnnotations = {
    //   ...initialState,
    //   values: [
    //     { id: '1', canvasId: 'canvas1', collectionId: 'collection1' },
    //     { id: '2', canvasId: 'canvas2', collectionId: 'collection2' },
    //   ],
    // };
    // const action = removeAnnotationsSuccess(['1']);
    // //@ts-expect-error initialStateWithAnnotations
    // const state = reducer(initialStateWithAnnotations, action);
    // expect(state.values).toHaveLength(1);
    // expect(state.values[0].id).toBe('2');
  });

  it('should handle fetchAnnotationsSuccess', () => {
    // const fetchedAnnotations = [
    //   { id: '1', canvasId: 'canvas1', collectionId: 'collection1' },
    //   { id: '2', canvasId: 'canvas2', collectionId: 'collection2' },
    // ];
    // const action = fetchAnnotationsSuccess(fetchedAnnotations as Annotation[]);
    // const state = reducer(initialState, action);
    // expect(state.values).toEqual(fetchedAnnotations);
  });
});
