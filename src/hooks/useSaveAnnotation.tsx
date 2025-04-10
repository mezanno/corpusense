import { Annotation, ElementType, W3CMotivationEnum } from '@/data/models/Annotation';
import { saveAnnotationRequest } from '@/state/reducers/annotations';
import { ImageAnnotation } from '@annotorious/annotorious';
import { useAppDispatch } from './hooks';

const URL_CLASSIFYING = '/class';
const URL_TAGGING = '/tag';

const useAddAnnotation = () => {
  const dispatch = useAppDispatch();

  return (annotation: ImageAnnotation, canvasId: string) => {
    const newAnnotation: Annotation = {
      ...annotation,
      // id: annotationId, //on garde l'ID d'origine pour garder la synchro avec Annotorious
      bodies: [
        {
          purpose: W3CMotivationEnum.Classifying,
          value: ElementType.TAG,
          annotation: annotation.id,
          id: annotation.id + URL_CLASSIFYING,
        },
        {
          purpose: W3CMotivationEnum.Tagging,
          value: '',
          annotation: annotation.id,
          id: annotation.id + URL_TAGGING,
        },
      ],
      canvasId,
    };

    dispatch(saveAnnotationRequest(newAnnotation));
  };
};

const useUpdateAnnotation = () => {
  const dispatch = useAppDispatch();

  return (annotation: Annotation, type?: ElementType, value?: string) => {
    const updatedAnnotation: Annotation = {
      ...annotation,
      bodies: [
        {
          purpose: W3CMotivationEnum.Classifying,
          value: type?.toString() ?? '',
          annotation: annotation.id,
          id: annotation.id + URL_CLASSIFYING,
        },
        {
          purpose: W3CMotivationEnum.Tagging,
          value: value,
          annotation: annotation.id,
          id: annotation.id + URL_TAGGING,
        },
      ],
    };

    dispatch(saveAnnotationRequest(updatedAnnotation));
  };
};

export { useAddAnnotation, useUpdateAnnotation };
