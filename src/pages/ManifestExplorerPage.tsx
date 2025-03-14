import CanvasViewer from '@/components/CanvasViewer';
import { Progress } from '@/components/ui/progress';
import { Toggle } from '@/components/ui/toggle';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { fetchManifestFromUrlRequest } from '@/state/reducers/manifests';
import { getCanvasForCanvas } from '@/state/selectors/canvas';
import { Annotorious } from '@annotorious/react';
import { PanelTopClose, PanelTopOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createWorker } from 'tesseract.js';
import CanvasGallery from '../components/CanvasGallery';
import ManifestDetails from '../components/ManifestDetails';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../components/ui/resizable';

const ManifestExplorerPage = () => {
  const canvasImage = useAppSelector(getCanvasForCanvas('test'));
  const [progress, setProgress] = useState(0);
  const [working, setWorking] = useState(false);
  const { isLoading, isLoaded } = useAppSelector((state) => state.manifests);
  const [isMetadataOpen, setIsMetadataOpen] = useState(true);
  const [isGalleryOpen, setIsGalleryOpen] = useState(true);

  const dispatch = useAppDispatch();

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('manifestId');
    if (id != null) {
      dispatch(fetchManifestFromUrlRequest(id));
    }
  }, [searchParams]);

  const handleGetOcr = async () => {
    if (!canvasImage) return;

    setWorking(true);
    const worker = await createWorker('fra', 1, {
      logger: (m) => {
        setProgress(m.progress * 100);
      },
    });
    console.log('OCR ', canvasImage);
    const {
      data: { text },
    } = await worker.recognize(canvasImage.id);
    console.log(text);
    await worker.terminate();
    setWorking(false);
  };

  return (
    <main className='relative h-full w-full'>
      <div className='mb-2 flex space-x-2'>
        <Toggle onPressedChange={setIsMetadataOpen} pressed={isMetadataOpen} variant='outline'>
          {isMetadataOpen ? (
            <>
              <PanelTopClose />
              Close Metadata
            </>
          ) : (
            <>
              <PanelTopOpen />
              Open Metadata
            </>
          )}
        </Toggle>
        <Toggle onPressedChange={setIsGalleryOpen} pressed={isGalleryOpen} variant='outline'>
          {isGalleryOpen ? (
            <>
              <PanelTopClose />
              Close Gallery
            </>
          ) : (
            <>
              <PanelTopOpen />
              Open Gallery
            </>
          )}
        </Toggle>
      </div>
      <ResizablePanelGroup direction='horizontal' className='h-full w-full space-x-2'>
        {isMetadataOpen && (
          <ResizablePanel className='flex h-full w-full justify-center rounded-lg bg-white'>
            <ManifestDetails />
          </ResizablePanel>
        )}
        {!isLoading && isLoaded && (
          <>
            {isGalleryOpen && (
              <>
                <ResizableHandle />

                <ResizablePanel className='h-full rounded-lg bg-white'>
                  <CanvasGallery />
                </ResizablePanel>
              </>
            )}

            <ResizableHandle />
            <ResizablePanel className='relative h-full w-full rounded-lg bg-white'>
              <Annotorious>
                <CanvasViewer />
              </Annotorious>
              <button
                className='absolute top-0 right-0 m-4 rounded-md bg-white p-2 shadow-md'
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onClick={handleGetOcr}
              >
                OCR
              </button>
              {working && (
                <div className='absolute top-0 left-0 flex h-full w-full items-center justify-center'>
                  <Progress value={progress} className='w-[60%]' />
                </div>
              )}
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </main>
  );
};

export default ManifestExplorerPage;

/*
On est obligé de séparer CanvasesViewer et CanvasImageViewer à cause de Selecto. Si les deux sont dans le même composant, 
Selecto empêche le fonctionnement correct de Annotorious.
*/

//TODO il va falloir attribuer un uuid aux composants qui veulent afficher un CanvasImageViewer (à transmettre dans le store)
