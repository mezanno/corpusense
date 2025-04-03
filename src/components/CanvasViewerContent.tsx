import { Annotation, ElementType } from '@/data/models/Annotation';
import { useAddAnnotation } from '@/hooks/useSaveAnnotation';
import { getAnnotations } from '@/state/selectors/annotations';
import { RootState } from '@/state/store';
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
};

export const CanvasViewerContent = ({ canvas }: CanvasViewerContentProps) => {
  console.log('CanvasViewerContent - render', canvas);

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
      console.log('createAnnotation', annotation);
      addAnnotation(annotation, canvas.id);
      cvcDispatch({ type: ACTIONS.SOMETHING_HAS_CHANGED, payload: true });
    };
    const onUpdate = (annotation: Annotation) => {
      console.log('updateAnnotation', annotation);
      // updateAnnotation(annotation);
      cvcDispatch({ type: ACTIONS.SOMETHING_HAS_CHANGED, payload: true });
    };
    const onDelete = (annotation: ImageAnnotation) => {
      console.log('deleteAnnotation', annotation);
      // dispatch(removeAnnotationRequest(annotation.id));
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
    console.log('handleDeleteAnnotation ', id);
    if (anno !== undefined) {
      anno.removeAnnotation(id);
    }
  };

  useEffect(() => {
    console.log('annotationsInStore updated', anno, annotationsInAnnotorious);
    if (annotationsInStore !== undefined && anno !== null) {
      annotationsInStore.forEach((annotation) => {
        if (!annotationsInAnnotorious.some((a) => a.id === annotation.id)) {
          try {
            anno.addAnnotation(annotation);
          } catch (e) {
            console.error('Error adding annotation', e);
          }
        } else {
          try {
            anno.updateAnnotation(annotation);
          } catch (e) {
            console.error('Error updating annotation', e);
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
      <div className='relative h-full w-full'>
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
      {/* <OpenSeadragonAnnotationPopup
                  popup={() => (
                    <HoverCard open={selected.length > 0}>
                      <HoverCardContent>
                        <div>{selected[0]?.annotation.bodies[1]?.value}</div>
                      </HoverCardContent>
                    </HoverCard>
                  )}
                  // popup={() => <AnnotationForm canvas={canvas} selected={selected} />}
                /> */}
    </OpenSeadragonAnnotator>
  );
};

export const CanvasViewerContentWithTools = withTools(CanvasViewerContent);
