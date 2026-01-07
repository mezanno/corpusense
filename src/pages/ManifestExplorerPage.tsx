import CanvasViewer from '@/components/canvasViewer/CanvasViewer';
import Loading from '@/components/Loading';
import NoManifestToShow from '@/components/NoManifestToShow';
import NothingToShow from '@/components/NothingToShow';
import { CanvasSelectionProvider } from '@/components/reducers/CanvasSelectionContext';
import { Toggle } from '@/components/ui/toggle';
import useConvertedFileIO from '@/hooks/data/convertedFiles/useConvertedFileIO';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { fecthManifestRequest } from '@/state/reducers/manifests';
import { Canvas } from '@iiif/presentation-3';
import { ArrowLeftToLine, ArrowRightToLine } from 'lucide-react';
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
  const { loadManifest } = useConvertedFileIO();

  const [searchParams] = useSearchParams();
  const [canvasToDisplay, setCanvasToDisplay] = useState<Canvas | null>(null);
  const [metadataVisible, setMetadataVisible] = useState(true);

  useEffect(() => {
    if (isLoading) {
      setCanvasToDisplay(null);
    }
  }, [isLoading]);

  useEffect(() => {
    const id = searchParams.get('manifestId');
    if (id != null) {
      appDispatch(fecthManifestRequest(id));
    } else {
      const indexeddbId = searchParams.get('indexeddbId');

      if (indexeddbId != null) {
        try {
          void loadManifest(indexeddbId);
        } catch (error) {
          console.error('Error loading manifest from IndexedDB:', error);
        }
      }
    }
    setCanvasToDisplay(null);
  }, [searchParams]);

  if (isLoading) {
    return <Loading />;
  }

  if (!isLoaded || loadedData == null) {
    return (
      <div className='flex h-full w-full flex-col items-center justify-center space-y-2 p-2'>
        <NoManifestToShow />
      </div>
    );
  }

  const manifest = loadedData.content;

  return (
    <div className='flex h-full w-full'>
      <div className='h-full'>
        <Toggle
          className='soft-button mt-4'
          onClick={() => setMetadataVisible(!metadataVisible)}
          title={`${metadataVisible ? t('btn_close_metadata') : t('btn_open_metadata')}`}
          pressed={metadataVisible}
        >
          {metadataVisible ? <ArrowLeftToLine /> : <ArrowRightToLine />}
        </Toggle>
      </div>
      <ResizablePanelGroup direction='horizontal' className='flex-1 space-x-2'>
        {metadataVisible && (
          <>
            <ResizablePanel
              order={1}
              id='metadata-panel'
              className='panel grow justify-center'
              minSize={25}
            >
              <ManifestDetails manifest={manifest} />
            </ResizablePanel>

            <ResizableHandle withHandle className='w-1 cursor-col-resize bg-dark-slate-gray' />
          </>
        )}

        {manifest.items.length > 0 && (
          <>
            <ResizablePanel order={2} id='gallery-panel' className='panel' minSize={25}>
              <CanvasSelectionProvider canvasesLoaded={manifest.items}>
                <CanvasGallery
                  setCanvasToDisplay={setCanvasToDisplay}
                  canvasToDisplay={canvasToDisplay}
                />
              </CanvasSelectionProvider>
            </ResizablePanel>
            <ResizableHandle withHandle className='w-1 cursor-col-resize bg-dark-slate-gray' />
          </>
        )}

        <ResizablePanel id='canvas-panel' order={3} minSize={30} className='panel'>
          <section
            className='flex h-full w-full items-center justify-center'
            aria-label='canvas viewer'
          >
            {canvasToDisplay === null ? (
              <NothingToShow />
            ) : (
              <CanvasViewer canvas={canvasToDisplay} />
            )}
          </section>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default ManifestExplorerPage;

/*
On est obligé de séparer CanvasesViewer et CanvasImageViewer à cause de Selecto. Si les deux sont dans le même composant, 
Selecto empêche le fonctionnement correct de Annotorious.
*/
