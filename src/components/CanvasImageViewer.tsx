import { useAppSelector } from '@/hooks/hooks';
import { getCanvasForCanvas } from '@/state/selectors/canvas';
import {
  Annotorious,
  OpenSeadragonAnnotationPopup,
  OpenSeadragonAnnotator,
  OpenSeadragonViewer,
  PopupProps,
} from '@annotorious/react';
import '@annotorious/react/annotorious-react.css';

const CanvasImageViewer = () => {
  const canvasImage = useAppSelector(getCanvasForCanvas('test'));

  if (!canvasImage) return <div>Nothing to display</div>;

  return (
    <Annotorious>
      <OpenSeadragonAnnotator drawingEnabled={true} drawingMode='click'>
        {/* <CloverImage
                  body={image}
                  isTiledImage={true}
                  openSeadragonConfig={{
                    loadTilesWithAjax: false,
                  }}
                  openSeadragonCallback={handleOpensadragon}
                /> */}
        <OpenSeadragonViewer
          className='h-full w-full'
          options={{
            prefixUrl: '/corpusense/images/',
            tileSources: {
              type: 'image',
              url: canvasImage.id,
            },
            loadTilesWithAjax: true,
            // showNavigator: true,
            showSequenceControl: true,
            showHomeControl: true,
            showFullPageControl: true,
          }}
        />
        <OpenSeadragonAnnotationPopup
          popup={(props: PopupProps) => <div className='annotorious-popup'>Hello World</div>}
        />
      </OpenSeadragonAnnotator>
    </Annotorious>
  );
};

export default CanvasImageViewer;
