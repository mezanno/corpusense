import { useAppSelector } from '@/hooks/hooks';
import { getCanvasForCanvas } from '@/state/selectors/canvas';
import '@annotorious/openseadragon/annotorious-openseadragon.css';
import {
  Annotorious,
  OpenSeadragonAnnotationPopup,
  OpenSeadragonAnnotator,
  OpenSeadragonViewer,
} from '@annotorious/react';

const CanvasImageViewer = () => {
  const canvasImage = useAppSelector(getCanvasForCanvas('test'));
  const handleOpensadragon = (viewer) => {
    // setViewer(v);
    // annotatorRef.current = createOSDAnnotator(viewer, {
    //   style: { outline: '2px solid red' },
    // });
    // annotatorRef.current.addAnnotation({
    //   shape: { type: 'rect', x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
    //   data: { id: 'annotation-1' },
    // });
  };

  // const style = (annotation: ImageAnnotation, state: AnnotationState) => ({
  //   fill: state.hovered ? '#ff0000' : '#ffffff',
  //   fillOpacity: 0.25,
  // });

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
            tileSources: {
              type: 'image',
              url: canvasImage.id,
            },
          }}
        />

        <OpenSeadragonAnnotationPopup
          popup={(props) => <div className='annotorious-popup'>Hello World</div>}
        />
        {/* <img src={canvasImage?.id} alt='test' /> */}
      </OpenSeadragonAnnotator>
    </Annotorious>
  );
};

export default CanvasImageViewer;
