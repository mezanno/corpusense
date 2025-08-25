import {
  Annotation,
  createAnnotationFromAnnotorious,
  createAnnotationFromExistingAnnotation,
  ElementType,
} from '@/data/models/Annotation';
import { saveAnnotationRequest } from '@/state/reducers/annotations';
import { ImageAnnotation } from '@annotorious/annotorious';
import { useAppDispatch } from './hooks';

const useAddAnnotation = () => {
  const dispatch = useAppDispatch();

  return (annotation: ImageAnnotation, canvasId: string, collectionId: string) => {
    const newAnnotation = createAnnotationFromAnnotorious({
      annotation,
      canvasId,
      collectionId,
      type: ElementType.REGION,
      value: '',
    });
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
