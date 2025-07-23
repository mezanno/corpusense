import { Annotation, ElementType } from '@/data/models/Annotation';
import { useAppDispatch } from '@/hooks/hooks';
import { useAddAnnotation } from '@/hooks/useSaveAnnotation';
import {
  removeAnnotationRequest,
  saveAnnotationRequest,
  updateAnnotationOrderValueRequest,
} from '@/state/reducers/annotations';
import { getAnnotations } from '@/state/selectors/annotations';
import { RootState } from '@/state/store';
import '@annotorious/openseadragon/annotorious-openseadragon.css';
import {
  AnnotationState,
  AnnotoriousOpenSeadragonAnnotator,
  DrawingStyleExpression,
  ImageAnnotation,
  OpenSeadragonAnnotationPopup,
  OpenSeadragonAnnotator,
  OpenSeadragonViewer,
  PopupProps,
  useAnnotations,
  useAnnotator,
  useSelection,
} from '@annotorious/react';
import { Canvas } from '@iiif/presentation-3';
import { useContext, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import AnnotationForm from './AnnotationForm';
import { HoverContext, ReducerContext } from './CanvasViewer';
import { Button } from './ui/button';
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

const AnnotationPopup = (props: PopupProps) => {
  const appDispatch = useAppDispatch();
  const annotation = props.annotation as Annotation;

  const handlePlus = () => {
    appDispatch(
      updateAnnotationOrderValueRequest({
        annotationId: annotation.id,
        value: (annotation.order ?? -1) + 1,
      }),
    );
  };

  const handleMinus = () => {
    appDispatch(
      updateAnnotationOrderValueRequest({
        annotationId: annotation.id,
        value: (annotation.order ?? 1) - 1,
      }),
    );
  };

  return (
    <div className='flex items-center gap-2 rounded-xl bg-white/75 p-2'>
      <Button className='soft-button' onClick={handleMinus}>
        -
      </Button>
      {annotation.order}
      <Button className='soft-button' onClick={handlePlus}>
        +
      </Button>
    </div>
  );
};

export type CanvasViewerContentProps = {
  canvas: Canvas;
  collectionId?: string;
};

export const CanvasViewerContent = ({ canvas, collectionId }: CanvasViewerContentProps) => {
  console.log(`CanvasViewerContent - render ${canvas.id}, ${collectionId}`);
  const appDispatch = useAppDispatch();
  const anno = useAnnotator<AnnotoriousOpenSeadragonAnnotator>(); //useRef perd la référence lors des opérations de suppression...
  const { selected } = useSelection(); //the annotation(s) selected in the annotorious viewer
  const annotationsInAnnotorious = useAnnotations();
  const annotationsInStore = useSelector((state: RootState) =>
    getAnnotations(state, canvas.id, collectionId ?? ''),
  );
  const addAnnotation = useAddAnnotation(); //logic to add an annotation to the store

  const { cvcState } = useContext(ReducerContext); //the reducer/state of the canvas viewer
  const { hoveredElement } = useContext(HoverContext);

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

  const handleDeleteAnnotation = () => {
    const ids = selected.map((s) => s.annotation.id);
    appDispatch(removeAnnotationRequest(ids)); //we don't need to remove the annotation from annotorious (anno.removeAnnotation(id)), it will be removed automatically (when sync with the store)
  };

  //initialize the Annotorious
  useEffect(() => {
    if (anno === null || anno === undefined) return;

    const onCreate = (annotation: ImageAnnotation) => {
      if (collectionId !== undefined) {
        addAnnotation(annotation, canvas.id, collectionId);
      } else {
        console.warn('No collectionId provided, annotation not saved');
      }
    };
    const onUpdate = (annotation: Annotation) => {
      appDispatch(saveAnnotationRequest(annotation));
    };

    anno.on('createAnnotation', onCreate);
    anno.on('updateAnnotation', onUpdate);

    if (isNewCanvas.current && annotationsInStore !== undefined) {
      //initializing Annototious with the annotations in the store
      anno.setAnnotations(annotationsInStore);
      isNewCanvas.current = false;
    }

    return () => {
      anno.off('createAnnotation', onCreate);
      anno.off('updateAnnotation', onUpdate);
    };
  }, [anno]);

  //when the canvas changes, clear the annotations of Annotorious
  useEffect(() => {
    if (anno !== null) {
      anno.clearAnnotations();
      isNewCanvas.current = true;
    }
  }, [canvas]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Delete' && selected?.length > 0) {
      handleDeleteAnnotation();
    }
  };

  const style = (annotation: Annotation, state?: AnnotationState) => {
    const value = annotation.bodies[0]?.value ?? ElementType.TAG;
    return {
      stroke: colors[value] || '#000000',
      fill: colors[value] || '#000000',
      fillOpacity: (state?.hovered ?? false) || hoveredElement === annotation.id ? 0.3 : 0.1,
    } as DrawingStyleExpression;
  };

  return (
    <OpenSeadragonAnnotator
      autoSave={true}
      drawingMode='drag'
      drawingEnabled={cvcState?.mode === 'draw'}
      multiSelect={true}
      style={style}
    >
      <div
        className={`relative h-full w-full ${cvcState?.mode === 'draw' ? 'cursor-pen-tool' : 'cursor-default'}`}
        onKeyDown={handleKeyDown}
      >
        <OpenSeadragonViewer
          aria-label='canvas viewer'
          className='h-full w-full bg-amber-50'
          options={{
            prefixUrl: `${import.meta.env.VITE_BASE_PATH}/images/`,
            defaultZoomLevel: 0.5,
            minZoomLevel: 0.1,
            tileSources: cvcState?.source,
            loadTilesWithAjax: true,
            crossOriginPolicy: 'Anonymous',
            showSequenceControl: true,
            showHomeControl: true,
            showFullPageControl: true,
            gestureSettingsMouse: {
              clickToZoom: false,
            },
          }}
        />
        {selected?.length > 0 && (
          <div className='absolute bottom-0 left-0 w-full bg-amber-100'>
            <AnnotationForm
              canvas={canvas}
              selected={selected}
              handleDelete={handleDeleteAnnotation}
            />
          </div>
        )}
      </div>
      <OpenSeadragonAnnotationPopup
        popup={(props) => <AnnotationPopup {...props} />}
        arrow={true}
        placement={'top'}
      />
    </OpenSeadragonAnnotator>
  );
};

export const CanvasViewerContentWithTools = withTools(CanvasViewerContent);
