import { removeAnnotationRequest } from '@/state/reducers/annotations';
import { getAnnotations } from '@/state/selectors/annotations';
import { AnnotoriousOpenSeadragonAnnotator, ImageAnnotation } from '@annotorious/react';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from './hooks';
import { useAddAnnotation } from './useSaveAnnotation';

export const useAnnotoriousStoreSync = (
  annotoriousInstance: AnnotoriousOpenSeadragonAnnotator,
  canvasId: string,
) => {
  const dispatch = useAppDispatch();
  const annotations = useSelector((state) => getAnnotations(state, canvasId));
  const addAnnotation = useAddAnnotation(); //custom hook to add annotations to the store
  const syncRef = useRef(false);

  useEffect(() => {
    if (annotoriousInstance === null || annotoriousInstance === undefined) return;

    console.log('init annotoriousInstance', annotoriousInstance);

    const onCreate = (annotation: ImageAnnotation) => {
      console.log('createAnnotation', annotation);
      addAnnotation(annotation, canvasId);
    };
    const onUpdate = (annotation: ImageAnnotation) => {
      console.log('updateAnnotation', annotation);
    };
    const onDelete = (annotation: ImageAnnotation) => {
      console.log('deleteAnnotation', annotation);
      dispatch(removeAnnotationRequest(annotation.id));
    };

    // annotoriousInstance.setAnnotations(annotations);
    annotoriousInstance.on('createAnnotation', onCreate);
    annotoriousInstance.on('updateAnnotation', onUpdate);
    annotoriousInstance.on('deleteAnnotation', onDelete);

    return () => {
      annotoriousInstance.off('createAnnotation', onCreate);
      annotoriousInstance.off('updateAnnotation', onUpdate);
      annotoriousInstance.off('deleteAnnotation', onDelete);
    };
  }, [annotoriousInstance]);

  useEffect(() => {
    console.log('useEffect - canvasId : ', canvasId);

    syncRef.current = false;
  }, [canvasId]);

  useEffect(() => {
    console.log('useEffect - syncRef.current : ', syncRef.current, ' -- ', annotations);
    if (syncRef.current) {
      console.log('set annotations', annotations);
      annotoriousInstance.clearAnnotations();
      annotoriousInstance.setAnnotations(annotations);
    }

    syncRef.current = true;
  }, [annotations]);
};
