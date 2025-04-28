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
      type: ElementType.TAG,
      value: '',
    });
    dispatch(saveAnnotationRequest(newAnnotation));
  };
};

const useUpdateAnnotation = () => {
  const dispatch = useAppDispatch();

  return (annotation: Annotation) => {
    //, type: ElementType, value: string) => {
    // const updatedAnnotation = createAnnotationFromExistingAnnotation({
    //   annotation,
    //   type,
    //   value,
    // });
    dispatch(saveAnnotationRequest(annotation));
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
    dispatch(saveAnnotationRequest(modifiedAnnotation));
  };
};

export { useAddAnnotation, useModifyAnnotation, useUpdateAnnotation };
