import '@annotorious/openseadragon/annotorious-openseadragon.css';
import { Annotorious } from '@annotorious/react';
import { Canvas } from '@iiif/presentation-3';
import { CanvasViewerContent, CanvasViewerContentWithTools } from './CanvasViewerContent';
import { CanvasViewerProvider } from './reducers/CanvasViewerContext';

const CanvasViewer = ({
  canvas,
  colllectionId: collectionId,
}: {
  canvas: Canvas;
  colllectionId?: string;
}) => {
  console.log('CanvasViewer - render ', canvas);

  return (
    <CanvasViewerProvider canvas={canvas}>
      <Annotorious>
        {collectionId !== undefined ? (
          <CanvasViewerContentWithTools collectionId={collectionId} />
        ) : (
          <CanvasViewerContent />
        )}
      </Annotorious>
    </CanvasViewerProvider>
  );
};

export default CanvasViewer;
