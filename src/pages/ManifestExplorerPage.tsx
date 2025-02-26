import CanvasViewer from '@/components/CanvasViewer';
import { Progress } from '@/components/ui/progress';
import { useAppSelector } from '@/hooks/hooks';
import { getCanvasForCanvas } from '@/state/selectors/canvas';
import { useState } from 'react';
import { createWorker } from 'tesseract.js';
import CanvasGallery from '../components/CanvasGallery';
import ManifestDetails from '../components/ManifestDetails';
import ManifestExplorerDrawer from '../components/ManifestExplorerDrawer';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../components/ui/resizable';

const ManifestExplorerPage = () => {
  const canvasImage = useAppSelector(getCanvasForCanvas('test'));
  const [progress, setProgress] = useState(0);
  const [working, setWorking] = useState(false);
  const { data, isLoading } = useAppSelector((state) => state.manifests);

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
    } = await worker.recognize(canvasImage.id as string);
    console.log(text);
    await worker.terminate();
    setWorking(false);
  };

  return (
    <main className='relative h-full w-full'>
      <ManifestExplorerDrawer />
      <ResizablePanelGroup direction='horizontal' className='h-full w-full space-x-2'>
        <ResizablePanel className='h-full rounded-lg bg-white'>
          <ManifestDetails />
        </ResizablePanel>
        {!isLoading && data !== null && (
          <>
            <ResizableHandle />
            <ResizablePanel className='h-full rounded-lg bg-white'>
              <CanvasGallery />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel className='relative h-full w-full rounded-lg bg-white'>
              <CanvasViewer />
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
