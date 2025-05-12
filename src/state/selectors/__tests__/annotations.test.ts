import { getPreloadedState } from '@/__tests__/preloadedState';
import { Annotation } from '@/data/models/Annotation';
import { RootState } from '../../store';
import { getAnnotations } from '../annotations';

// Mock data
const mockAnnotations: Annotation[] = [
  { id: '1', canvasId: 'canvas1', collectionId: 'collection1', order: 2 } as Annotation,
  { id: '2', canvasId: 'canvas1', collectionId: 'collection1', order: 1 } as Annotation,
  { id: '3', canvasId: 'canvas2', collectionId: 'collection1', order: 3 } as Annotation,
  { id: '4', canvasId: 'canvas1', collectionId: 'collection2', order: 4 } as Annotation,
];

const preloadedState = getPreloadedState();
const mockState: RootState = {
  ...preloadedState,
  annotations: {
    ...preloadedState.annotations,
    values: mockAnnotations,
  },
};
console.log('Mock state:', mockState.annotations);

describe('getAnnotations selector', () => {
  it('should return sorted annotations for the given canvasId and collectionId', () => {
    const canvasId = 'canvas1';
    const collectionId = 'collection1';

    const result = getAnnotations(mockState, canvasId, collectionId);

    expect(result).toStrictEqual([
      { id: '2', canvasId: 'canvas1', collectionId: 'collection1', order: 1 },
      { id: '1', canvasId: 'canvas1', collectionId: 'collection1', order: 2 },
    ]);
  });

  it('should return an empty array if no annotations match the canvasId and collectionId', () => {
    const canvasId = 'canvas3';
    const collectionId = 'collection3';

    const result = getAnnotations(mockState, canvasId, collectionId);

    expect(result).toEqual([]);
  });

  it('should return annotations sorted by order even if some annotations have no order', () => {
    const mockAnnotationsWithNoOrder: Annotation[] = [
      { id: '1', canvasId: 'canvas1', collectionId: 'collection1' } as Annotation,
      { id: '2', canvasId: 'canvas1', collectionId: 'collection1', order: 1 } as Annotation,
    ];

    const mockStateWithNoOrder: RootState = {
      ...preloadedState,
      annotations: {
        ...preloadedState.annotations,
        values: mockAnnotationsWithNoOrder,
      },
    };

    const canvasId = 'canvas1';
    const collectionId = 'collection1';

    const result = getAnnotations(mockStateWithNoOrder, canvasId, collectionId);

    //if there is no order, the order is 0
    expect(result).toStrictEqual([
      { id: '1', canvasId: 'canvas1', collectionId: 'collection1' },
      { id: '2', canvasId: 'canvas1', collectionId: 'collection1', order: 1 },
    ]);
  });
});
