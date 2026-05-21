import { Annotation, getAnnotationType, isAnnotation } from '@/data/models/Annotation';
import { scale, scaleAnnotation } from '@/data/utils/annotations';
import { useAnnotationActions } from '@/hooks/data/annotations/useAnnotationActions';
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
import { useAnnotationContext } from '../reducers/AnnotationContext';
import { CanvasViewerMode } from './CanvasViewer';

const CanvasViewerAnnotations = ({
  canvas,
  collectionId,
  showAnnotations,
  setMode,
  annotationScale,
}: {
  canvas: Canvas;
  collectionId: string;
  showAnnotations: boolean;
  setMode: (mode: CanvasViewerMode) => void;
  annotationScale: number;
}) => {
  const { selected } = useSelection(); //the annotation(s) selected in the annotorious viewer
  const anno = useAnnotator<AnnotoriousOpenSeadragonAnnotator>(); //useRef perd la référence lors des opérations de suppression...
  const annotationsInAnnotorious = useAnnotations();
  const { scopeAnnotations: annotationsInStore, getLastOrderByType } = useAnnotationContext();
  const { saveAnnotation, updateAnnotation } = useAnnotationActions();

  const isNewCanvas = useRef(true); //to check if the canvas is new (to avoid syncing the annotations when the canvas is the same)
  const annotationsInAnnotoriousRef = useRef(annotationsInAnnotorious);
  const prevScale = useRef(annotationScale);

  useEffect(() => {
    annotationsInAnnotoriousRef.current = annotationsInAnnotorious;
  }, [annotationsInAnnotorious]);

  useEffect(() => {
    if (anno !== null) {
      anno.clearAnnotations();
      isNewCanvas.current = true;
    }
  }, [canvas, anno]);

  // Synchronise les annotations du store avec celles d'Annotorious après le chargement initial du canvas
  useEffect(() => {
    if (anno === null || anno === undefined) return;

    if (isNewCanvas.current === false) {
      const currentAnnotorious = annotationsInAnnotoriousRef.current;

      //sync the annotations in the store with the annotations in annotorious
      annotationsInStore.forEach((annotation) => {
        const existing = currentAnnotorious.find((a) => a.id === annotation.id);
        try {
          //if the annotation is already in annotorious, update it
          if (existing) {
            console.log('updating ', annotation);
            if (annotationScale !== 1) {
              const scaledAnnotation = scaleAnnotation(annotation, annotationScale);
              anno.updateAnnotation(scaledAnnotation);
            } else {
              anno.updateAnnotation(annotation);
            }
          } else {
            //if the annotation is not already in annotorious, add it
            if (annotationScale !== 1) {
              const scaledAnnotation = scaleAnnotation(annotation, annotationScale);
              anno.addAnnotation(scaledAnnotation);
            } else {
              anno.addAnnotation(annotation);
            }
          }
        } catch (e) {
          console.error(`Error ${existing ? 'updating' : 'adding'} annotation`, e);
        }
      });

      //sync annotations in annotorious with annotations in the store (remove the ones that are not in the store)
      currentAnnotorious.forEach((annotation) => {
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
  }, [annotationsInStore, anno, annotationScale]);

  //initialize the Annotorious event listeners
  useEffect(() => {
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
        void (async () => {
          await saveAnnotation(annotation, canvas.id, collectionId);
        })();
      } else {
        console.warn('No collectionId provided, annotation not saved');
      }
      setMode(CanvasViewerMode.MOVE);
    };
    const onUpdate = (annotation: ImageAnnotation) => {
      if (isAnnotation(annotation)) {
        void (async () => {
          await updateAnnotation(annotation);
        })();
      }
    };

    anno.on('createAnnotation', onCreate);
    anno.on('updateAnnotation', onUpdate);

    return () => {
      anno.off('createAnnotation', onCreate);
      anno.off('updateAnnotation', onUpdate);
      // viewer.removeAllHandlers('tile-load-failed');
      viewer.removeAllHandlers('open-failed');
    };
  }, [anno, canvas.id, collectionId, saveAnnotation, updateAnnotation, setMode]);

  // Initialise les annotations ou recalculer leur échelle lorsque celle-ci change
  useEffect(() => {
    if (anno === null || anno === undefined || annotationsInStore === undefined) return;

    if (isNewCanvas.current || annotationScale !== prevScale.current) {
      const scaledAnnotations = annotationScale !== 1
        ? scale(annotationsInStore, annotationScale)
        : annotationsInStore;
      anno.setAnnotations(scaledAnnotations);
      isNewCanvas.current = false;
      prevScale.current = annotationScale;
    }
  }, [anno, annotationsInStore, annotationScale]);

  useEffect(() => {
    if (anno !== null) {
      anno.setVisible(showAnnotations);
    }
  }, [showAnnotations, anno]);

  if (selected.length === 0 || selected.length > 1) {
    return null;
  }

  return (
    <div className='max-w-1/2 min-w-1/3'>
      <AnnotationForm
        annotation={selected[0].annotation as Annotation}
        lastOrder={getLastOrderByType(getAnnotationType(selected[0].annotation as Annotation))}
      />
    </div>
  );
};

export default CanvasViewerAnnotations;
