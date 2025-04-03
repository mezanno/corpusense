import { Annotation, ElementType } from '@/data/models/Annotation';
import { saveAnnotationRequest } from '@/state/reducers/annotations';
import { ImageAnnotation } from '@annotorious/annotorious';
import { useAppDispatch } from './hooks';
// import { v4 as uuid } from 'uuid';

const useAddAnnotation = () => {
  const dispatch = useAppDispatch();

  return (annotation: ImageAnnotation, canvasId: string) => {
    console.log('useAddAnnotation ', annotation.id);
    const annotationWithoutDate: Annotation = {
      ...annotation,
      target: {
        ...annotation.target,
        created: undefined,
      },
      bodies: [
        {
          purpose: 'classifying',
          value: ElementType.TAG,
          annotation: '',
          id: annotation.id + '-c',
        },
        {
          purpose: 'tagging',
          value: '',
          annotation: '',
          id: annotation.id + '-t',
        },
      ],
      canvasId,
    };

    dispatch(saveAnnotationRequest(annotationWithoutDate));
  };
};

const useUpdateAnnotation = () => {
  const dispatch = useAppDispatch();

  return (annotation: Annotation, type?: ElementType, value?: string) => {
    console.log('useUpdateAnnotation', annotation, type, value);
    const updatedAnnotation: Annotation = {
      ...annotation,
      bodies: [
        {
          purpose: 'classifying',
          value: type?.toString() ?? '',
          annotation: '',
          id: annotation.id + '-c',
        },
        {
          purpose: 'tagging',
          value: value,
          annotation: '',
          id: annotation.id + '-t',
        },
      ],
    };

    dispatch(saveAnnotationRequest(updatedAnnotation));
  };
};

export { useAddAnnotation, useUpdateAnnotation };
