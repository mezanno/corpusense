import { Annotation, ElementType } from '@/data/models/Annotation';
import { useAppDispatch } from '@/hooks/hooks';
import { useAddAnnotation } from '@/hooks/useSaveAnnotation';
import { removeAnnotationRequest } from '@/state/reducers/annotations';
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
  useAnnotations,
  useAnnotator,
  useSelection,
} from '@annotorious/react';
import { Canvas } from '@iiif/presentation-3';
import { useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import AnnotationForm from './AnnotationForm';
import { HoverContext, ReducerContext } from './CanvasViewer';
import { ACTIONS } from './reducers/CanvasViewerContentReducer';
import withTools from './withTools';

const colors = {
  [ElementType.TAG.toString()]: '#00ff00',
  [ElementType.ENTRY.toString()]: '#ff0000',
  [ElementType.COLUMN.toString()]: '#0000ff',
  [ElementType.LINE.toString()]: '#000000',
  [ElementType.PAGE.toString()]: '#ff00ff',
};

export type CanvasViewerContentProps = {
  canvas: Canvas;
  collectionId?: string;
};

export const CanvasViewerContent = ({ canvas, collectionId }: CanvasViewerContentProps) => {
  // console.log('CanvasViewerContent - render', canvas);
  const appDispatch = useAppDispatch();
  const anno = useAnnotator<AnnotoriousOpenSeadragonAnnotator>(); //useRef perd la référence lors des opérations de suppression...
  // useAnnotoriousStoreSync(anno, canvas?.id);
  const annotationsInStore = useSelector((state: RootState) => getAnnotations(state, canvas.id));
  const annotationsInAnnotorious = useAnnotations();
  const { selected } = useSelection();

  const { cvcState, cvcDispatch } = useContext(ReducerContext);
  const { hoveredElement } = useContext(HoverContext);

  const addAnnotation = useAddAnnotation();

  useEffect(() => {
    if (anno === null || anno === undefined) return;

    const onCreate = (annotation: ImageAnnotation) => {
      if (collectionId !== undefined) {
        addAnnotation(annotation, canvas.id, collectionId);
        cvcDispatch({ type: ACTIONS.SOMETHING_HAS_CHANGED, payload: true });
      } else {
        console.warn('No collectionId provided, annotation not saved');
      }
    };
    const onUpdate = (annotation: Annotation) => {
      console.log('updateAnnotation', annotation);
      // updateAnnotation(annotation);
      cvcDispatch({ type: ACTIONS.SOMETHING_HAS_CHANGED, payload: true });
    };
    const onDelete = (annotation: ImageAnnotation) => {
      appDispatch(removeAnnotationRequest(annotation.id));
      cvcDispatch({ type: ACTIONS.SOMETHING_HAS_CHANGED, payload: true });
    };

    anno.on('createAnnotation', onCreate);
    anno.on('updateAnnotation', onUpdate);
    anno.on('deleteAnnotation', onDelete);

    return () => {
      anno.off('createAnnotation', onCreate);
      anno.off('updateAnnotation', onUpdate);
      anno.off('deleteAnnotation', onDelete);
      // syncRef.current = false; //if the annotoriousInstance changes, reset the syncRef
    };
  }, [anno]);

  const handleDeleteAnnotation = (id: string) => {
    if (anno !== undefined) {
      anno.removeAnnotation(id);
    }
  };

  useEffect(() => {
    console.log('annotationsInStore updated', anno);
    console.log('annotationsInStore', annotationsInStore);
    console.log('annotationsInAnnotorious', annotationsInAnnotorious);

    if (annotationsInStore !== undefined && anno !== null) {
      //for each annotation in the redux store
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
      //for each annotation in annotorious
      annotationsInAnnotorious.forEach((annotation) => {
        //if the annotation is not in the redux store, remove it
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

  useEffect(() => {
    if (anno !== null) {
      anno.clearAnnotations();
    }
  }, [canvas]);

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
      drawingMode='click'
      drawingEnabled={cvcState?.mode === 'draw'}
      style={style}
    >
      <div
        className={`relative h-full w-full ${cvcState?.mode === 'draw' ? 'cursor-pen-tool' : 'cursor-default'}`}
      >
        <OpenSeadragonViewer
          aria-label='canvas viewer'
          className='h-full w-full bg-amber-50'
          options={{
            prefixUrl: '/corpusense/images/',
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
      <OpenSeadragonAnnotationPopup popup={() => <div>Test</div>} />
    </OpenSeadragonAnnotator>
  );
};

export const CanvasViewerContentWithTools = withTools(CanvasViewerContent);
