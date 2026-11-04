import Loading from '@/components/common/Loading';
import NothingToShow from '@/components/common/NothingToShow';
import CanvasViewer from '@/components/features/canvasViewer/CanvasViewer';
import ManifestCanvasGallery from '@/components/features/manifests/ManifestCanvasGallery';
import ManifestExplorer from '@/components/features/manifests/ManifestExplorer';
import ManifestNavigation from '@/components/features/manifests/ManifestNavigation';
import NoManifestToShow from '@/components/features/manifests/NoManifestToShow';
import { CanvasSelectionProvider } from '@/components/reducers/CanvasSelectionContext';
import { useManifestPageContext } from '@/components/reducers/ManifestPageContext';
import useKeyboard from '@/hooks/ui/useKeyboard';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../components/ui/resizable';

const ManifestExplorerPage = () => {
  const { t } = useTranslation();
  const [metadataVisible, _setMetadataVisible] = useState(true);
  const {
    isLoading,
    manifest,
    sourceWithContent,
    canvasToDisplay,
    setCanvasToDisplay,
    handleNext,
    handlePrevious,
  } = useManifestPageContext();

  const onKeyPressed = (key: string) => {
    if (key === 'ArrowRight') {
      handleNext();
    } else if (key === 'ArrowLeft') {
      handlePrevious();
    }
  };
  useKeyboard({ onKeyPressed });

  if (isLoading) {
    return <Loading />;
  }

  if (manifest === undefined || sourceWithContent == null) {
    return (
      <div className='flex h-full w-full flex-col items-center justify-center space-y-2 p-2'>
        <NoManifestToShow />
      </div>
    );
  }

  return (
    <div className='flex h-full w-full'>
      {/* <div className='h-full'>
        <Toggle
          className='soft-button mt-4'
          onClick={() => setMetadataVisible(!metadataVisible)}
          title={`${metadataVisible ? t('btn_close_metadata') : t('btn_open_metadata')}`}
          pressed={metadataVisible}
        >
          {metadataVisible ? <ArrowLeftToLine /> : <ArrowRightToLine />}
        </Toggle>
      </div> */}
      <ResizablePanelGroup direction='horizontal' className='flex-1 space-x-2'>
        {metadataVisible && (
          <>
            <ResizablePanel
              order={1}
              id='metadata-panel'
              className='panel grow justify-center'
              minSize={25}
            >
              <ManifestExplorer manifest={manifest} source={sourceWithContent} />
            </ResizablePanel>

            <ResizableHandle withHandle className='w-1 cursor-col-resize bg-dark-slate-gray' />
          </>
        )}

        {manifest.items.length > 0 && (
          <>
            <ResizablePanel order={2} id='gallery-panel' className='panel' minSize={25}>
              <CanvasSelectionProvider canvasesLoaded={manifest.items}>
                <ManifestCanvasGallery
                  setCanvasToDisplay={setCanvasToDisplay}
                  canvasToDisplay={canvasToDisplay}
                  sourceWithContent={sourceWithContent}
                />
              </CanvasSelectionProvider>
            </ResizablePanel>
            <ResizableHandle withHandle className='w-1 cursor-col-resize bg-dark-slate-gray' />
          </>
        )}

        <ResizablePanel id='canvas-panel' order={3} minSize={30} className='panel'>
          <section
            className='flex h-full w-full flex-col items-center justify-center'
            aria-label={t('aria_label_canvas_viewer')}
          >
            {canvasToDisplay === null ? (
              <NothingToShow />
            ) : (
              <>
                <CanvasViewer canvas={canvasToDisplay} sourceId={sourceWithContent.id} />
                <ManifestNavigation />
              </>
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
