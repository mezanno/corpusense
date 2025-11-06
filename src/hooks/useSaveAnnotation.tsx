import {
  Annotation,
  createAnnotationFromAnnotorious,
  createBodies,
  ElementType,
} from '@/data/models/Annotation';
import { saveAnnotationRequest, updateAnnotationRequest } from '@/state/reducers/annotations';
import { ImageAnnotation } from '@annotorious/annotorious';
import { useAppDispatch } from './hooks';

const useAddAnnotation = () => {
  const dispatch = useAppDispatch();

  return (annotation: ImageAnnotation, canvasId: string, collectionId: string) => {
    const newAnnotation = createAnnotationFromAnnotorious({
      annotation,
      canvasId,
      collectionId,
      type: ElementType.TEXT_REGION,
      value: '',
    });
    dispatch(saveAnnotationRequest(newAnnotation));
  };
};

const useModifyAnnotation = () => {
  const dispatch = useAppDispatch();

  return (annotation: Annotation, type: ElementType, value: string) => {
    // const modifiedAnnotation = createAnnotationFromExistingAnnotation({
    //   annotation,
    //   type,
    //   value,
    // });
    const modifiedAnnotation = {
      ...annotation,
      bodies: createBodies(type, value, annotation.id),
    };
    dispatch(updateAnnotationRequest(modifiedAnnotation));
  };
};

export { useAddAnnotation, useModifyAnnotation };
