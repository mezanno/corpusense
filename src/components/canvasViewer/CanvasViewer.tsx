import '@annotorious/openseadragon/annotorious-openseadragon.css';
import { Annotorious } from '@annotorious/react';
import { Canvas } from '@iiif/presentation-3';
import { useState } from 'react';
import CollectionNavigation from '../collectionPage/CollectionNavigation';
import ModifierChainFlow from '../modifiers/ModifierChainFlow';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable';
import CanvasViewerAnnotations from './CanvasViewerAnnotations';
import CanvasViewerOSDContent from './CanvasViewerOSDContent';
import CanvasViewerText from './CanvasViewerText';
import CanvasViewerToolbar from './CanvasViewerToolbar';

export enum CanvasViewerMode {
  DRAW = 'draw',
  MOVE = 'move',
}

const CanvasViewer = ({
  canvas,
  collectionId: collectionId,
  setCanvasToDisplay,
}: {
  canvas: Canvas;
  collectionId?: string;
  setCanvasToDisplay?: (canvas: Canvas | null) => void;
}) => {
  const [mode, setMode] = useState<CanvasViewerMode>(CanvasViewerMode.MOVE);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showText, setShowText] = useState(false);
  const [showModifiers, setShowModifiers] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null); // ID of hovered annotation (in text view)
  const [annotationScale, setAnnotationScale] = useState(1);

  const toggleAnnotations = () => {
    setShowAnnotations(!showAnnotations);
  };

  const toggleText = () => {
    setShowText(!showText);
  };

  const toggleModifiers = () => {
    setShowModifiers((prev) => !prev);
  };

  return (
    <Annotorious>
      <div className='flex h-full w-full flex-col'>
        {collectionId !== undefined && (
          <CanvasViewerToolbar
            collectionId={collectionId}
            canvas={canvas}
            mode={mode}
            setMode={setMode}
            showAnnotations={showAnnotations}
            toggleAnnotations={toggleAnnotations}
            toggleText={toggleText}
            showText={showText}
            showModifiers={showModifiers}
            toggleMoidifiers={toggleModifiers}
            annotationScale={annotationScale}
            setAnnotationScale={setAnnotationScale}
          />
        )}
        <div className='flex min-h-0 flex-1'>
          {collectionId !== undefined && showText && (
            <CanvasViewerText
              scope={{ collectionId, canvasId: canvas.id }}
              setHovered={setHovered}
            />
          )}
          <div className='flex w-1/2 flex-1'>
            <ResizablePanelGroup className='flex h-full w-full flex-col' direction='vertical'>
              <ResizablePanel minSize={50} className='flex h-full w-full flex-col'>
                <CanvasViewerOSDContent
                  canvas={canvas}
                  mode={mode}
                  hovered={hovered}
                  setHovered={setHovered}
                />
                {collectionId !== undefined && setCanvasToDisplay && <CollectionNavigation />}
              </ResizablePanel>
              {showModifiers && collectionId !== undefined && (
                <>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={50} minSize={25}>
                    <ModifierChainFlow scope={{ collectionId, canvasId: canvas.id }} />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>

            {collectionId !== undefined && (
              <CanvasViewerAnnotations
                canvas={canvas}
                collectionId={collectionId}
                showAnnotations={showAnnotations}
                setMode={setMode}
                annotationScale={annotationScale}
              />
            )}
          </div>
        </div>
      </div>
    </Annotorious>
  );
};

export default CanvasViewer;
