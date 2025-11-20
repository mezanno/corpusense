import '@annotorious/openseadragon/annotorious-openseadragon.css';
import { Annotorious } from '@annotorious/react';
import { Canvas } from '@iiif/presentation-3';
import { useState } from 'react';
import CanvasViewerAnnotations from './CanvasViewerAnnotations';
import CanvasViewerOSDContent from './CanvasViewerOSDContent';
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
  console.log('CanvasViewer - render ', canvas);

  const [mode, setMode] = useState<CanvasViewerMode>(CanvasViewerMode.MOVE);
  const [showAnnotations, setShowAnnotations] = useState(true);

  const toggleAnnotations = () => {
    setShowAnnotations(!showAnnotations);
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
          />
        )}
        <div className='flex w-full flex-1'>
          <CanvasViewerOSDContent canvas={canvas} mode={mode} />
          {collectionId !== undefined && (
            <CanvasViewerAnnotations
              canvas={canvas}
              collectionId={collectionId}
              showAnnotations={showAnnotations}
            />
          )}
        </div>
      </div>
    </Annotorious>
  );
};

export default CanvasViewer;
