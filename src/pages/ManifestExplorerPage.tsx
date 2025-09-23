import CanvasViewer from '@/components/CanvasViewer';
import NoManifestToShow from '@/components/NoManifestToShow';
import { CanvasSelectionProvider } from '@/components/reducers/CanvasSelectionContext';
import { Toggle } from '@/components/ui/toggle';
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

  const [searchParams] = useSearchParams();
  const [canvasToDisplay, setCanvasToDisplay] = useState<Canvas | undefined>(undefined);
  const [metadataVisible, setMetadataVisible] = useState(true);

  useEffect(() => {
    const id = searchParams.get('manifestId');
    if (id != null) {
      appDispatch(fecthManifestRequest(id));
    }
    setCanvasToDisplay(undefined);
  }, [searchParams]);

  if (isLoading || !isLoaded || loadedData == null) {
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

        {loadedData?.content?.items !== undefined && loadedData?.content?.items.length > 0 && (
          <>
            <ResizablePanel order={2} id='gallery-panel' className='panel' minSize={25}>
              <CanvasSelectionProvider canvasesLoaded={loadedData.content.items}>
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
          <CanvasViewer canvas={canvasToDisplay} />
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
