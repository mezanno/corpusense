import '@annotorious/openseadragon/annotorious-openseadragon.css';
import { Annotorious } from '@annotorious/react';
import { Canvas } from '@iiif/presentation-3';
import { useState } from 'react';
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
}: {
  canvas: Canvas;
  collectionId?: string;
}) => {
  const [mode, setMode] = useState<CanvasViewerMode>(CanvasViewerMode.MOVE);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showText, setShowText] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null); // ID of hovered annotation (in text view)

  const toggleAnnotations = () => {
    setShowAnnotations(!showAnnotations);
  };

  const toggleText = () => {
    setShowText(!showText);
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
          />
        )}
        <div className='flex h-full w-full'>
          {collectionId !== undefined && showText && (
            <CanvasViewerText
              scope={{ collectionId, canvasId: canvas.id }}
              setHovered={setHovered}
            />
          )}
          <div className='flex w-1/2 flex-1'>
            <CanvasViewerOSDContent
              canvas={canvas}
              mode={mode}
              hovered={hovered}
              setHovered={setHovered}
            />
            {collectionId !== undefined && (
              <CanvasViewerAnnotations
                canvas={canvas}
                collectionId={collectionId}
                showAnnotations={showAnnotations}
                setMode={setMode}
              />
            )}
          </div>
        </div>
      </div>
    </Annotorious>
  );
};

export default CanvasViewer;
