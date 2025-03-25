import { Annotation } from '@/data/models/Annotation';
import { removeAnnotationRequest } from '@/state/reducers/annotations';
import { getAnnotations } from '@/state/selectors/annotations';
import { RootState } from '@/state/store';
import { AnnotoriousOpenSeadragonAnnotator, ImageAnnotation } from '@annotorious/react';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from './hooks';
import { useAddAnnotation, useUpdateAnnotation } from './useSaveAnnotation';

/*
 This hook is used to sync the annotations between the Annotorious instance and the store.
  It listens for createAnnotation, updateAnnotation, and deleteAnnotation events from the Annotorious instance.
  Existing annotations are loaded into the Annotorious instance when the canvasId changes or when the Annotorious instance is set
 */
export const useAnnotoriousStoreSync = (
  annotoriousInstance: AnnotoriousOpenSeadragonAnnotator,
  canvasId: string,
) => {
  const dispatch = useAppDispatch();
  const annotations = useSelector((state: RootState) => getAnnotations(state, canvasId));
  const addAnnotation = useAddAnnotation(); //custom hook to add annotations to the store
  const updateAnnotation = useUpdateAnnotation(); //custom hook to update annotations in the store
  const syncRef = useRef(false); //determines if the annotations have been synced

  useEffect(() => {
    if (annotoriousInstance === null || annotoriousInstance === undefined) return;

    const onCreate = (annotation: ImageAnnotation) => {
      console.log('createAnnotation', annotation);
      addAnnotation(annotation, canvasId);
    };
    const onUpdate = (annotation: Annotation) => {
      console.log('updateAnnotation', annotation);
      updateAnnotation(annotation);
    };
    const onDelete = (annotation: ImageAnnotation) => {
      console.log('deleteAnnotation', annotation);
      dispatch(removeAnnotationRequest(annotation.id));
    };

    annotoriousInstance.on('createAnnotation', onCreate);
    annotoriousInstance.on('updateAnnotation', onUpdate);
    annotoriousInstance.on('deleteAnnotation', onDelete);

    return () => {
      annotoriousInstance.off('createAnnotation', onCreate);
      annotoriousInstance.off('updateAnnotation', onUpdate);
      annotoriousInstance.off('deleteAnnotation', onDelete);
      syncRef.current = false; //if the annotoriousInstance changes, reset the syncRef
    };
  }, [annotoriousInstance]);

  useEffect(() => {
    //if the canvasId changes, reset the syncRef
    syncRef.current = false;
  }, [canvasId]);

  useEffect(() => {
    if (!syncRef.current && canvasId !== undefined && annotoriousInstance !== null) {
      annotoriousInstance.clearAnnotations();
      annotoriousInstance.setAnnotations(annotations);
      syncRef.current = true;
    }
  }, [annotations]);
};
