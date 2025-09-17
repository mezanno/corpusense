import CanvasViewer from '@/components/CanvasViewer';
import { CanvasSelectionProvider } from '@/components/reducers/CanvasSelectionContext';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { fecthManifestRequest } from '@/state/reducers/manifests';
import { Canvas } from '@iiif/presentation-3';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import CanvasGallery from '../components/CanvasGallery';
import ManifestDetails from '../components/ManifestDetails';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../components/ui/resizable';

const ManifestExplorerPage = () => {
  const appDispatch = useAppDispatch();
  const { isLoading, isLoaded, loadedData } = useAppSelector((state) => state.manifests);

  const [searchParams] = useSearchParams();
  const [canvasToDisplay, setCanvasToDisplay] = useState<Canvas | undefined>(undefined);

  useEffect(() => {
    const id = searchParams.get('manifestId');
    if (id != null) {
      appDispatch(fecthManifestRequest(id));
    }
  }, [searchParams]);

  return (
    <ResizablePanelGroup direction='horizontal' className='flex-1 space-x-2'>
      <>
        <ResizablePanel
          order={1}
          id='metadata-panel'
          className='panel flex justify-center'
          minSize={25}
        >
          <ManifestDetails />
        </ResizablePanel>
        <ResizableHandle withHandle />
      </>

      {!isLoading && isLoaded && (
        <>
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
              <ResizableHandle withHandle />
            </>
          )}

          <ResizablePanel id='canvas-panel' order={3} minSize={30} className='panel relative'>
            <CanvasViewer canvas={canvasToDisplay} />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
};

export default ManifestExplorerPage;

/*
On est obligé de séparer CanvasesViewer et CanvasImageViewer à cause de Selecto. Si les deux sont dans le même composant, 
Selecto empêche le fonctionnement correct de Annotorious.
*/
