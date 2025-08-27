import CanvasViewer from '@/components/CanvasViewer';
import { CanvasSelectionProvider } from '@/components/reducers/CanvasSelectionContext';
import { Toggle } from '@/components/ui/toggle';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { fecthManifestRequest } from '@/state/reducers/manifests';
import { Canvas } from '@iiif/presentation-3';
import { PanelTopClose, PanelTopOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import CanvasGallery from '../components/CanvasGallery';
import ManifestDetails from '../components/ManifestDetails';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../components/ui/resizable';

const ManifestExplorerPage = () => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const { isLoading, isLoaded, loadedData } = useAppSelector((state) => state.manifests);
  const [isMetadataOpen, setIsMetadataOpen] = useState(true);
  const [isGalleryOpen, setIsGalleryOpen] = useState(true);
  const [searchParams] = useSearchParams();
  const [canvasToDisplay, setCanvasToDisplay] = useState<Canvas | undefined>(undefined);

  useEffect(() => {
    const id = searchParams.get('manifestId');
    if (id != null) {
      appDispatch(fecthManifestRequest(id));
    }
  }, [searchParams]);

  return (
    <>
      {isLoaded && (
        <section className='mb-2 flex space-x-2'>
          <Toggle onPressedChange={setIsMetadataOpen} pressed={isMetadataOpen} variant='outline'>
            {isMetadataOpen ? (
              <>
                <PanelTopClose />
                {t('btn_close_metadata')}
              </>
            ) : (
              <>
                <PanelTopOpen />
                {t('btn_open_metadata')}
              </>
            )}
          </Toggle>
          <Toggle onPressedChange={setIsGalleryOpen} pressed={isGalleryOpen} variant='outline'>
            {isGalleryOpen ? (
              <>
                <PanelTopClose />
                {t('btn_close_gallery')}
              </>
            ) : (
              <>
                <PanelTopOpen />
                {t('btn_open_gallery')}
              </>
            )}
          </Toggle>
        </section>
      )}
      <ResizablePanelGroup direction='horizontal' className='flex-1 space-x-2'>
        {isMetadataOpen && (
          <>
            <ResizablePanel
              order={1}
              id='metadata-panel'
              className='flex h-full w-full justify-center rounded-lg bg-white'
              minSize={25}
            >
              <ManifestDetails />
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        {!isLoading && isLoaded && (
          <>
            {isGalleryOpen &&
              loadedData?.content?.items !== undefined &&
              loadedData?.content?.items.length > 0 && (
                <>
                  <ResizablePanel
                    order={2}
                    id='gallery-panel'
                    className='h-full rounded-lg bg-white'
                    minSize={25}
                  >
                    <CanvasSelectionProvider canvasesLoaded={loadedData.content.items}>
                      <CanvasGallery setCanvasToDisplay={setCanvasToDisplay} />
                    </CanvasSelectionProvider>
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                </>
              )}

            <ResizablePanel
              id='canvas-panel'
              order={3}
              minSize={30}
              className='relative h-full w-full rounded-lg bg-white'
            >
              <CanvasViewer canvas={canvasToDisplay} />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </>
  );
};

export default ManifestExplorerPage;

/*
On est obligé de séparer CanvasesViewer et CanvasImageViewer à cause de Selecto. Si les deux sont dans le même composant, 
Selecto empêche le fonctionnement correct de Annotorious.
*/

//TODO il va falloir attribuer un uuid aux composants qui veulent afficher un CanvasImageViewer (à transmettre dans le store)
