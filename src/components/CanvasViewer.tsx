import { useAppSelector } from '@/hooks/hooks';
import { getCanvasForCanvas } from '@/state/selectors/canvas';
import {
  Annotorious,
  OpenSeadragonAnnotationPopup,
  OpenSeadragonAnnotator,
  OpenSeadragonViewer,
} from '@annotorious/react';
import '@annotorious/react/annotorious-react.css';
import { NothingToShow } from './NothingToShow';

const CanvasViewer = () => {
  const canvasImage = useAppSelector(getCanvasForCanvas('test'));

  return (
    <section
      className='flex h-full w-full items-center justify-center'
      aria-labelledby='canvas-viewer'
    >
      {canvasImage === undefined ? (
        <NothingToShow />
      ) : (
        <Annotorious>
          <OpenSeadragonAnnotator drawingEnabled={true} drawingMode='click'>
            <OpenSeadragonViewer
              className='h-full w-full bg-amber-50'
              options={{
                prefixUrl: '/corpusense/images/',
                tileSources: {
                  type: 'image',
                  url: canvasImage.id,
                },
                loadTilesWithAjax: true,
                showSequenceControl: true,
                showHomeControl: true,
                showFullPageControl: true,
              }}
            />
            <OpenSeadragonAnnotationPopup
              popup={() => <div className='annotorious-popup'>Hello World</div>}
            />
          </OpenSeadragonAnnotator>
        </Annotorious>
      )}
    </section>
  );
};

export default CanvasViewer;
