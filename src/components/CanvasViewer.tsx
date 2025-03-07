import { useAppSelector } from '@/hooks/hooks';
import { getCanvasForCanvas } from '@/state/selectors/canvas';
import {
  Annotorious,
  OpenSeadragonAnnotationPopup,
  OpenSeadragonAnnotator,
  OpenSeadragonViewer,
} from '@annotorious/react';
import '@annotorious/react/annotorious-react.css';
import { IIIFExternalWebResource } from '@iiif/presentation-3';
import { NothingToShow } from './NothingToShow';

const CanvasViewer = () => {
  const canvasImage = useAppSelector(getCanvasForCanvas('test')) as IIIFExternalWebResource;

  return (
    <section className='flex h-full w-full items-center justify-center' aria-label='canvas viewer'>
      {canvasImage === undefined || canvasImage.service === undefined ? (
        <NothingToShow />
      ) : (
        <Annotorious>
          <OpenSeadragonAnnotator drawingEnabled={true} drawingMode='click'>
            <OpenSeadragonViewer
              aria-label='canvas viewer'
              className='h-full w-full bg-amber-50'
              options={{
                prefixUrl: '/corpusense/images/',
                defaultZoomLevel: 0.5,
                tileSources: [
                  {
                    '@context': 'http://library.stanford.edu/iiif/image-api/1.1/context.json',
                    // '@id': `http://localhost:3001/proxy?url=${encodeURIComponent('https://gallica.bnf.fr/iiif/ark:/12148/bpt6k14267837/f6')}`,
                    '@id': canvasImage.service[0]['@id'],
                    height: canvasImage.height,
                    width: canvasImage.width,
                    profile: [
                      'http://library.stanford.edu/iiif/image-api/1.1/compliance.html#level2',
                    ],
                  },
                ],
                loadTilesWithAjax: true,
                crossOriginPolicy: 'Anonymous',
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
