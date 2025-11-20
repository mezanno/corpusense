import { Annotation, isAnnotation } from '@/data/models/Annotation';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { useAddAnnotation } from '@/hooks/useSaveAnnotation';
import { updateAnnotationRequest } from '@/state/reducers/annotations';
import { selectAnnotations } from '@/state/selectors/annotations';
import {
  AnnotoriousOpenSeadragonAnnotator,
  ImageAnnotation,
  useAnnotations,
  useAnnotator,
  useSelection,
} from '@annotorious/react';
import { Canvas } from '@iiif/presentation-3';
import { useEffect, useRef } from 'react';
import AnnotationForm from '../forms/AnnotationForm';

const CanvasViewerAnnotations = ({
  canvas,
  collectionId,
  showAnnotations,
}: {
  canvas: Canvas;
  collectionId: string;
  showAnnotations: boolean;
}) => {
  const appDispatch = useAppDispatch();
  const { selected } = useSelection(); //the annotation(s) selected in the annotorious viewer
  const anno = useAnnotator<AnnotoriousOpenSeadragonAnnotator>(); //useRef perd la référence lors des opérations de suppression...
  const annotationsInAnnotorious = useAnnotations();
  const annotationsInStore = useAppSelector(selectAnnotations);
  const addAnnotation = useAddAnnotation(); //logic to add an annotation to the store

  const isNewCanvas = useRef(true); //to check if the canvas is new (to avoid syncing the annotations when the canvas is the same)

  useEffect(() => {
    if (isNewCanvas.current === false) {
      //sync the annotations in the store with the annotations in annotorious
      annotationsInStore.forEach((annotation) => {
        const existing = annotationsInAnnotorious.find((a) => a.id === annotation.id);
        try {
          //if the annotation is already in annotorious, update it
          if (existing) {
            anno.updateAnnotation(annotation);
          } else {
            //if the annotation is not already in annotorious, add it
            anno.addAnnotation(annotation);
          }
        } catch (e) {
          console.error(`Error ${existing ? 'updating' : 'adding'} annotation`, e);
        }
      });

      //sync annotations in annotorious with annotations in the store (remove the ones that are not in the store)
      annotationsInAnnotorious.forEach((annotation) => {
        //if the annotation is not in the store, remove it
        if (!annotationsInStore.some((a) => a.id === annotation.id)) {
          try {
            anno.removeAnnotation(annotation.id);
          } catch (e) {
            console.error('Error removing annotation', e);
          }
        }
      });
    }
  }, [annotationsInStore]);

  //initialize the Annotorious
  useEffect(() => {
    console.log('CanvasViewerContent - useEffect anno ', anno);

    if (anno === null || anno === undefined) return;

    const viewer = anno.viewer;
    // viewer.addHandler('tile-load-failed', (event) => {
    //   console.log("Erreur lors du chargement d'une tuile", event);
    // });
    viewer.addHandler('open-failed', (event) => {
      console.log("Erreur lors du chargement d'une source'", event);
    });

    const onCreate = (annotation: ImageAnnotation) => {
      if (collectionId !== undefined) {
        console.log('Creating annotation ', annotation);

        addAnnotation(annotation, canvas.id, collectionId);
      } else {
        console.warn('No collectionId provided, annotation not saved');
      }
      // setMode(CanvasViewerMode.MOVE);
    };
    const onUpdate = (annotation: ImageAnnotation) => {
      if (isAnnotation(annotation)) {
        appDispatch(updateAnnotationRequest(annotation));
      }
    };

    anno.on('createAnnotation', onCreate);
    anno.on('updateAnnotation', onUpdate);

    if (isNewCanvas.current && collectionId !== undefined && annotationsInStore !== undefined) {
      //initializing Annototious with the annotations in the store
      anno.setAnnotations(annotationsInStore);
      isNewCanvas.current = false;
    }

    return () => {
      anno.off('createAnnotation', onCreate);
      anno.off('updateAnnotation', onUpdate);
      // viewer.removeAllHandlers('tile-load-failed');
      viewer.removeAllHandlers('open-failed');
    };
  }, [anno]);

  useEffect(() => {
    if (anno !== null) {
      anno.setVisible(showAnnotations);
    }
  }, [showAnnotations]);

  if (selected.length === 0 || selected.length > 1) {
    return null;
  }

  return (
    <div className='max-w-1/2 min-w-1/3'>
      <AnnotationForm annotation={selected[0].annotation as Annotation} />
    </div>
  );
};

export default CanvasViewerAnnotations;
