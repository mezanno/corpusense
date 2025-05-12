import annotationsForCanvas from '@/__tests__/annotationsForCanvas.json';
import newAnnotation from '@/__tests__/newAnnotation.json';
import { Annotation } from '@/data/models/Annotation';
import { getAnnotationRepository } from '@/data/repositories/indexeddb/dbFactory';
import { expectSaga } from 'redux-saga-test-plan';
import { throwError } from 'redux-saga-test-plan/providers';
import { call } from 'redux-saga/effects';
import { Mock, vi } from 'vitest';
import {
  removeAllAnnotationsRequest,
  removeAllAnnotationsSuccess,
  removeAnnotationRequest,
  removeAnnotationSuccess,
  saveAnnotationRequest,
  saveAnnotationSuccess,
  updateAnnotationOrderValueRequest,
  updateAnnotationOrderValueSuccess,
} from '../../reducers/annotations';
import {
  handleRemoveAllAnnotations,
  handleRemoveAnnotation,
  handleSaveAnnotation,
  handleUpdateAnnotationOrderValue,
} from '../annotations';

vi.mock('@/data/repositories/indexeddb/dbFactory', () => ({
  getAnnotationRepository: vi.fn(),
}));

describe('annotations saga', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('handleSaveAnnotation', () => {
    it('should handle saveAnnotation and dispatch saveAnnotationSuccess with a new annotation (order = 0)', () => {
      const mockRepository = {
        getById: vi.fn(),
        updateAnnotation: vi.fn(),
        getAnnotationsForCanvas: vi.fn().mockResolvedValue([]),
      };
      (getAnnotationRepository as jest.Mock).mockReturnValue(mockRepository);

      const expectedNewAnnotation = {
        ...newAnnotation,
        order: 0,
      };
      return expectSaga(handleSaveAnnotation, saveAnnotationRequest(newAnnotation as Annotation))
        .provide([
          [
            call([mockRepository, mockRepository.getById], newAnnotation.id),
            throwError(new Error()),
          ],
          [call([mockRepository, mockRepository.updateAnnotation], newAnnotation), undefined],
          [
            call([mockRepository, mockRepository.getAnnotationsForCanvas], newAnnotation.canvasId),
            [],
          ],
        ])
        .put(saveAnnotationSuccess(expectedNewAnnotation as Annotation))
        .run();
    });

    it('should handle saveAnnotation and dispatch saveAnnotationSuccess with a new annotation (order = 2)', () => {
      const mockRepository = {
        getById: vi.fn(),
        updateAnnotation: vi.fn(),
        getAnnotationsForCanvas: vi.fn().mockResolvedValue(annotationsForCanvas),
      };
      (getAnnotationRepository as jest.Mock).mockReturnValue(mockRepository);

      const expectedNewAnnotation = {
        ...newAnnotation,
        order: 2,
      };
      return expectSaga(handleSaveAnnotation, saveAnnotationRequest(newAnnotation as Annotation))
        .provide([
          [
            call([mockRepository, mockRepository.getById], newAnnotation.id),
            throwError(new Error()),
          ],
          [call([mockRepository, mockRepository.updateAnnotation], newAnnotation), undefined],
          [
            call([mockRepository, mockRepository.getAnnotationsForCanvas], newAnnotation.canvasId),
            annotationsForCanvas,
          ],
        ])
        .put(saveAnnotationSuccess(expectedNewAnnotation as Annotation))
        .run();
    });

    it('should handle saveAnnotation and dispatch saveAnnotationSuccess with an updated annotation', () => {
      const mockRepository = {
        getById: vi.fn().mockResolvedValue(newAnnotation),
        updateAnnotation: vi.fn(),
      };
      (getAnnotationRepository as jest.Mock).mockReturnValue(mockRepository);

      const differentAnnotation = {
        ...newAnnotation,
        order: 10,
      };

      return expectSaga(handleSaveAnnotation, saveAnnotationRequest(newAnnotation as Annotation))
        .provide([
          [call([mockRepository, mockRepository.getById], newAnnotation.id), differentAnnotation],
          [call([mockRepository, mockRepository.updateAnnotation], newAnnotation), undefined],
        ])
        .put(saveAnnotationSuccess(newAnnotation as Annotation))
        .run();
    });

    it('should handle saveAnnotation and do nothing', () => {
      const mockRepository = {
        getById: vi.fn().mockResolvedValue(newAnnotation),
        updateAnnotation: vi.fn(),
      };
      (getAnnotationRepository as jest.Mock).mockReturnValue(mockRepository);

      return expectSaga(handleSaveAnnotation, saveAnnotationRequest(newAnnotation as Annotation))
        .provide([
          [call([mockRepository, mockRepository.getById], newAnnotation.id), newAnnotation],
          [call([mockRepository, mockRepository.updateAnnotation], newAnnotation), undefined],
        ])
        .not.put(saveAnnotationSuccess(newAnnotation as Annotation))
        .run();
    });
  });

  it('should handle removeAnnotation and dispatch removeAnnotationSuccess', () => {
    const annotationId = '1';
    const mockRepository = {
      removeById: vi.fn().mockResolvedValue(undefined),
    };
    (getAnnotationRepository as Mock).mockReturnValue(mockRepository);

    return expectSaga(handleRemoveAnnotation, removeAnnotationRequest(annotationId))
      .provide([[call([mockRepository, mockRepository.removeById], annotationId), undefined]])
      .put(removeAnnotationSuccess(annotationId))
      .run();
  });

  it('should handle removeAllAnnotations and dispatch removeAllAnnotationsSuccess', () => {
    const collectionId = 'collection1';
    const mockCanvasIds = ['canvas1', 'canvas2'];
    const mockRepository = {
      removeAllAnnotations: vi.fn().mockResolvedValue(mockCanvasIds),
    };
    (getAnnotationRepository as Mock).mockReturnValue(mockRepository);

    return expectSaga(handleRemoveAllAnnotations, removeAllAnnotationsRequest(collectionId))
      .provide([
        [call([mockRepository, mockRepository.removeAllAnnotations], collectionId), mockCanvasIds],
      ])
      .put(removeAllAnnotationsSuccess(mockCanvasIds))
      .run();
  });

  describe('handleUpdateAnnotationOrderValue', () => {
    it('should handle updateAnnotationOrderValue and dispatch updateAnnotationOrderValueSuccess', () => {
      const mockRepository = {
        updateOrder: vi.fn().mockResolvedValue(undefined),
      };
      (getAnnotationRepository as Mock).mockReturnValue(mockRepository);

      return expectSaga(
        handleUpdateAnnotationOrderValue,
        updateAnnotationOrderValueRequest({ annotationId: 'annotationId', value: 2 }),
      )
        .provide([
          [call([mockRepository, mockRepository.updateOrder], 'annotationId', 2), undefined],
        ])
        .call([mockRepository, mockRepository.updateOrder], 'annotationId', 2)
        .put(updateAnnotationOrderValueSuccess({ annotationId: 'annotationId', value: 2 }))
        .run();
    });
  });
});
