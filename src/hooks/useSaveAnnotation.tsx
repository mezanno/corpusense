import {
  Annotation,
  createAnnotationFromExistingAnnotation,
  ElementType,
} from '@/data/models/Annotation';
import { saveAnnotationRequest } from '@/state/reducers/annotations';
import { ImageAnnotation } from '@annotorious/annotorious';
import { useAppDispatch } from './hooks';

const useAddAnnotation = () => {
  const dispatch = useAppDispatch();

  return (annotation: ImageAnnotation, canvasId: string, collectionId: string) => {
    const newAnnotation = createAnnotationFromExistingAnnotation({
      annotation,
      canvasId,
      collectionId,
      order: -1,
      type: ElementType.REGION,
      value: '',
    });
    console.log('useAddAnnotation');
    dispatch(saveAnnotationRequest(newAnnotation));
  };
};

const useModifyAnnotation = () => {
  const dispatch = useAppDispatch();

  return (annotation: Annotation, type: ElementType, value: string) => {
    const modifiedAnnotation = createAnnotationFromExistingAnnotation({
      annotation,
      type,
      value,
    });
    console.log('useModifyAnnotation ', modifiedAnnotation);
    dispatch(saveAnnotationRequest(modifiedAnnotation));
  };
};

export { useAddAnnotation, useModifyAnnotation };
