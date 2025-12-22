import { Annotation, ElementType } from '@/data/models/Annotation';
import { getSource } from '@/data/utils/canvas';
import { useAnnotationActions } from '@/hooks/data/annotations/useAnnotationActions';
import {
  AnnotationState,
  DrawingStyleExpression,
  OpenSeadragonAnnotator,
  OpenSeadragonViewer,
  useHover,
  useSelection,
} from '@annotorious/react';
import { Canvas } from '@iiif/presentation-3';
import OpenSeadragon from 'openseadragon';
import { useEffect, useState } from 'react';
import { CanvasViewerMode } from './CanvasViewer';

const colors = {
  [ElementType.TEXT_LINE.toString()]: '#2a9d8f',
  [ElementType.TEXT_REGION.toString()]: '#e76f51',
  [ElementType.UNKNOWN.toString()]: '#e9c46a',
};

const CanvasViewerOSDContent = ({ canvas, mode }: { canvas: Canvas; mode: CanvasViewerMode }) => {
  const hover = useHover();
  const { selected } = useSelection(); //the annotation(s) selected in the annotorious viewer
  const { removeAnnotationsByIds } = useAnnotationActions();
  const [options, setOptions] = useState<OpenSeadragon.Options | null>(null);

  console.log('CanvasViewerOSDContent render - canvas id: ', canvas.id);

  useEffect(() => {
    const loadSource = async () => {
      const source = await getSource(canvas);
      setOptions({
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
      });
    };

    void loadSource();
  }, [canvas]);

  const style = (annotation: Annotation, state?: AnnotationState) => {
    const value = annotation.bodies[0]?.value ?? ElementType.UNKNOWN;
    return {
      stroke: colors[value] || '#000000',
      strokeWidth: 2,
      fill: colors[value] || '#000000',
      fillOpacity: (state?.hovered ?? false) || hover?.id === annotation.id ? 0.3 : 0.1,
    } as DrawingStyleExpression;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    console.log('handleKeyDown: ', selected);

    if (event.key === 'Delete' && selected?.length > 0) {
      const ids = selected.map((s) => s.annotation.id);
      void (async () => {
        await removeAnnotationsByIds(ids); //we don't need to remove the annotation from annotorious (anno.removeAnnotation(id)), it will be removed automatically (when sync with the store)
      })();
    }
  };

  return (
    <OpenSeadragonAnnotator
      autoSave={true}
      drawingMode='drag'
      drawingEnabled={mode === CanvasViewerMode.DRAW}
      multiSelect={true}
      style={style}
    >
      <div
        className={`h-full w-full ${mode === CanvasViewerMode.DRAW ? 'cursor-pen-tool' : 'cursor-default'}`}
        onKeyDown={handleKeyDown}
      >
        {options != null && (
          <OpenSeadragonViewer
            aria-label='canvas viewer'
            className='h-full w-full'
            options={options}
          />
        )}
      </div>
    </OpenSeadragonAnnotator>
  );
};

export default CanvasViewerOSDContent;
