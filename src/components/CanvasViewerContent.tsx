import { Annotation, ElementType, isAnnotation } from '@/data/models/Annotation';
import { useAppDispatch } from '@/hooks/hooks';
import { useAddAnnotation } from '@/hooks/useSaveAnnotation';
import { updateAnnotationRequest } from '@/state/reducers/annotations';
import { selectAnnotations } from '@/state/selectors/annotations';
import '@annotorious/openseadragon/annotorious-openseadragon.css';
import {
  AnnotationState,
  AnnotoriousOpenSeadragonAnnotator,
  DrawingStyleExpression,
  ImageAnnotation,
  OpenSeadragonAnnotator,
  OpenSeadragonViewer,
  useAnnotations,
  useAnnotator,
  useHover,
} from '@annotorious/react';
import { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { CanvasViewerMode } from './reducers/CanvasViewerContext';
import { useCanvasViewerContext } from './reducers/useCanvasViewerContext';
import withTools from './withTools';

//bleu foncé : #264653
//ver clair : #2a9d8f
//ocre : #e9c46a
//orange : #f4a261
//rouge : #e76f51

const colors = {
  [ElementType.TAG.toString()]: '#ffffff',
  [ElementType.ENTRY.toString()]: '#264653',
  [ElementType.COLUMN.toString()]: '#0000ff',
  [ElementType.LINE.toString()]: '#2a9d8f',
  [ElementType.PAGE.toString()]: '#e9c46a',
  [ElementType.REGION.toString()]: '#e76f51',
};

export const CanvasViewerContent = ({ collectionId }: { collectionId?: string }) => {
  const appDispatch = useAppDispatch();
  const {
    canvas,
    setMode,
    setHovered,
    setSourceAsImage,
    showAnnotations,
    source,
    mode,
    hoveredElement,
    error,
  } = useCanvasViewerContext();
  console.log(`CanvasViewerContent - render ${canvas.id}, ${collectionId}`);
  const anno = useAnnotator<AnnotoriousOpenSeadragonAnnotator>(); //useRef perd la référence lors des opérations de suppression...

  const annotationsInAnnotorious = useAnnotations();
  const annotationsInStore = useSelector(selectAnnotations);
  const addAnnotation = useAddAnnotation(); //logic to add an annotation to the store

  const hover = useHover();

  useEffect(() => {
    setHovered(hover?.id);
  }, [hover]);

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
      //Check if the url exists in the cache and update the source
      if (error === undefined) {
        setSourceAsImage();
      }
    });

    const onCreate = (annotation: ImageAnnotation) => {
      if (collectionId !== undefined) {
        console.log('Creating annotation ', annotation);

        addAnnotation(annotation, canvas.id, collectionId);
      } else {
        console.warn('No collectionId provided, annotation not saved');
      }
      setMode(CanvasViewerMode.MOVE);
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

  //when the canvas changes, clear the annotations of Annotorious
  useEffect(() => {
    if (anno !== null) {
      anno.clearAnnotations();
      isNewCanvas.current = true;
    }
  }, [canvas]);

  useEffect(() => {
    if (anno !== null) {
      anno.setVisible(showAnnotations);
    }
  }, [showAnnotations]);

  const style = (annotation: Annotation, state?: AnnotationState) => {
    const value = annotation.bodies[0]?.value ?? ElementType.TAG;
    return {
      stroke: colors[value] || '#000000',
      strokeWidth: 2,
      fill: colors[value] || '#000000',
      fillOpacity: (state?.hovered ?? false) || hoveredElement === annotation.id ? 0.3 : 0.1,
    } as DrawingStyleExpression;
  };

  //TODO : on a des renders qui se produisent quand on déplace une annotation (??)
  const options = useMemo(
    () => ({
      prefixUrl: `${import.meta.env.VITE_BASE_PATH}/images/`,
      defaultZoomLevel: 0.5,
      minZoomLevel: 0.1,
      tileSources: source,
      loadTilesWithAjax: true,
      // crossOriginPolicy: 'false',
      showSequenceControl: true,
      showHomeControl: true,
      showFullPageControl: true,
      gestureSettingsMouse: {
        clickToZoom: false,
      },
      tileRetryMax: 5,
      tileRetryDelay: 2000,
    }),
    [source],
  );

  return (
    <OpenSeadragonAnnotator
      autoSave={true}
      drawingMode='drag'
      drawingEnabled={mode === CanvasViewerMode.DRAW}
      multiSelect={true}
      style={style}
    >
      <div
        className={`relative h-full w-full ${mode === CanvasViewerMode.DRAW ? 'cursor-pen-tool' : 'cursor-default'}`}
      >
        <OpenSeadragonViewer
          aria-label='canvas viewer'
          className='h-full w-full'
          options={options}
        />
      </div>
    </OpenSeadragonAnnotator>
  );
};

export const CanvasViewerContentWithTools = withTools(CanvasViewerContent);
