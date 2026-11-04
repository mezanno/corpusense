import { Annotation, ElementType } from '@/data/models/annotations/annotation';
import {
  getDistanceBetweenAnnotationCenters,
  getDistanceBetweenAnnotations,
  getRectFromBounds,
} from '@/data/utils/annotations';
import { useAnnotationActions } from '@/hooks/data/annotations/useAnnotationActions';
import useTileSource from '@/hooks/data/sources/useTileSource';
import {
  AnnotationState,
  AnnotoriousOpenSeadragonAnnotator,
  DrawingStyleExpression,
  OpenSeadragonAnnotationPopup,
  OpenSeadragonAnnotator,
  OpenSeadragonViewer,
  PopupProps,
  useAnnotator,
  useHover,
  useSelection,
} from '@annotorious/react';
import { Canvas } from '@iiif/presentation-3';
import {
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  MoveHorizontal,
  MoveVertical,
} from 'lucide-react';
import OpenSeadragon from 'openseadragon';
import { Component, ErrorInfo, ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CanvasViewerMode } from './CanvasViewer';

const colors = {
  [ElementType.TEXT_LINE.toString()]: '#2a9d8f',
  [ElementType.TEXT_REGION.toString()]: '#e76f51',
  [ElementType.UNKNOWN.toString()]: '#e9c46a',
  [ElementType.TEMP.toString()]: '#2646bb',
};

class OpenSeadragonErrorBoundary extends Component<
  { children: ReactNode; fallback: (error: Error) => ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {}

  render() {
    return this.state.error === null ? this.props.children : this.props.fallback(this.state.error);
  }
}

const CanvasViewerOSDContent = ({
  canvas,
  sourceId,
  mode,
  hovered,
  setHovered,
}: {
  canvas: Canvas;
  sourceId: string;
  mode: CanvasViewerMode;
  hovered: string | null;
  setHovered: (id: string | null) => void;
}) => {
  const { t } = useTranslation();
  const hover = useHover();
  const { selected } = useSelection(); //the annotation(s) selected in the annotorious viewer
  const { removeAnnotationsByIds } = useAnnotationActions();
  const anno = useAnnotator<AnnotoriousOpenSeadragonAnnotator>();
  const { error, source } = useTileSource({ canvas, sourceId });
  const viewerKey = `${canvas.id}:${sourceId}`;
  const [viewerError, setViewerError] = useState<{ key: string; message: string } | null>(null);

  const options =
    source !== null
      ? {
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
        }
      : null;

  useEffect(() => {
    if (anno === null || anno === undefined) return;

    const viewer = anno.viewer;
    const handleOpenFailed = (event: OpenSeadragon.OpenFailedEvent) => {
      setViewerError({ key: viewerKey, message: event.message });
    };
    const handleTileLoadFailed = (event: OpenSeadragon.TileLoadFailedEvent) => {
      setViewerError({ key: viewerKey, message: event.message });
    };

    viewer.addHandler('open-failed', handleOpenFailed);
    viewer.addHandler('tile-load-failed', handleTileLoadFailed);

    return () => {
      viewer.removeHandler('open-failed', handleOpenFailed);
      viewer.removeHandler('tile-load-failed', handleTileLoadFailed);
    };
  }, [anno, viewerKey]);

  useEffect(() => {
    if (hovered != null) {
      const a = anno.getAnnotationById(hovered);
      if (a != null) {
        const rect = getRectFromBounds(a);
        const topleft = anno.viewer.viewport.imageToViewportCoordinates(rect.x, rect.y);
        const bottomright = anno.viewer.viewport.imageToViewportCoordinates(
          rect.x + rect.width,
          rect.y + rect.height,
        );
        const boxWidth = bottomright.x - topleft.x;
        const boxHeight = bottomright.y - topleft.y;
        anno.viewer.viewport.fitBounds(
          new OpenSeadragon.Rect(topleft.x, topleft.y, boxWidth, boxHeight),
          true,
        );
      }
    }
  }, [hovered]);

  const style = (annotation: Annotation, state?: AnnotationState) => {
    const value = annotation.bodies[0]?.value ?? ElementType.UNKNOWN;
    return {
      stroke: colors[value] || '#000000',
      strokeWidth: 2,
      fill: colors[value] || '#000000',
      fillOpacity:
        (state?.hovered ?? false) || hover?.id === annotation.id || annotation.id === hovered
          ? 0.35
          : 0.1,
    } as DrawingStyleExpression;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Delete' && selected?.length > 0) {
      const ids = selected.map((s) => s.annotation.id);
      void (async () => {
        await removeAnnotationsByIds(ids); //we don't need to remove the annotation from annotorious (anno.removeAnnotation(id)), it will be removed automatically (when sync with the store)
      })();
    }
  };

  if (error != null) {
    return (
      <div className='flex h-full w-full items-center justify-center'>
        <p className='text-red-500'>{t('error_loading_canvas', { error: error })}</p>
      </div>
    );
  }

  const distanceBetweenSelectedAnnotations =
    selected?.length === 2
      ? getDistanceBetweenAnnotations(selected[0].annotation, selected[1].annotation)
      : null;
  const distanceBetweenSelectedAnnotationCenters =
    selected?.length === 2
      ? getDistanceBetweenAnnotationCenters(selected[0].annotation, selected[1].annotation)
      : null;

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
        onMouseLeave={() => setHovered(null)}
      >
        {viewerError?.key === viewerKey ? (
          <div className='flex h-full w-full items-center justify-center' role='alert'>
            <p className='text-red-500'>
              {t('error_loading_canvas', { error: viewerError.message })}
            </p>
          </div>
        ) : (
          options != null && (
            <OpenSeadragonErrorBoundary
              key={viewerKey}
              fallback={(boundaryError) => (
                <div className='flex h-full w-full items-center justify-center' role='alert'>
                  <p className='text-red-500'>
                    {t('error_loading_canvas', { error: boundaryError.message })}
                  </p>
                </div>
              )}
            >
              <OpenSeadragonViewer
                aria-label={t('aria_label_canvas_viewer')}
                className='h-full w-full'
                options={options}
              />
            </OpenSeadragonErrorBoundary>
          )
        )}
      </div>
      {distanceBetweenSelectedAnnotations && distanceBetweenSelectedAnnotationCenters && (
        <OpenSeadragonAnnotationPopup
          popup={(_props: PopupProps) => (
            <div className='flex items-center space-x-1 rounded bg-white p-2 text-sm shadow'>
              <MoveHorizontal size={16} />
              {distanceBetweenSelectedAnnotations.horizontal.toFixed()}
              <MoveVertical className='ml-3' size={16} />
              {distanceBetweenSelectedAnnotations.vertical.toFixed()}
              <AlignHorizontalDistributeCenter size={16} className='ml-3' />
              {distanceBetweenSelectedAnnotationCenters.horizontal.toFixed()}
              <AlignVerticalDistributeCenter size={16} className='ml-3' />
              {distanceBetweenSelectedAnnotationCenters.vertical.toFixed()}
            </div>
          )}
        />
      )}
    </OpenSeadragonAnnotator>
  );
};

export default CanvasViewerOSDContent;
