import ResultsAvailable from '@/components/common/ResultsAvailable';
import CanvasViewer from '@/components/features/canvasViewer/CanvasViewer';
import LlmStatus from '@/components/features/collections/LlmStatus';
import OcrStatus from '@/components/features/collections/OcrStatus';
import { useAnnotationContext } from '@/components/reducers/AnnotationContext';
import { useCollectionContext } from '@/components/reducers/CollectionContext';
import { useCollectionInspectorContext } from '@/components/reducers/CollectionInspectorContext';
import { useWorkerContext } from '@/components/reducers/WorkerContext';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import useKeyboard from '@/hooks/ui/useKeyboard';
import 'gridstack/dist/gridstack.min.css';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import CollectionInspectorGallery from './CollectionInspectorGallery';
import CollectionInspectorHeader from './CollectionInspectorHeader';
import CollectionToolbar from './CollectionToolbar';
import CollectionWorkerCounters from './CollectionWorkerCounters';

const CollectionInspectorContent = ({
  collectionId,
  defaultCanvasId,
}: {
  collectionId: string;
  defaultCanvasId: string | null;
}) => {
  const { t } = useTranslation();
  const {
    collection,
    canvases,
    getCanvasById,
    setCanvasToDisplay,
    canvasToDisplay,
    handleNext,
    handlePrevious,
  } = useCollectionInspectorContext();
  const { openCollection } = useCollectionContext();
  const isWorkerRunning = useWorkerContext().isWorkerOrTaskRunning({ collectionId });

  const { setScope } = useAnnotationContext();

  const canvas = defaultCanvasId !== null ? getCanvasById(defaultCanvasId) : null;

  const onKeyPressed = (key: string) => {
    if (key === 'ArrowRight') {
      handleNext();
    } else if (key === 'ArrowLeft') {
      handlePrevious();
    }
  };

  useKeyboard({ onKeyPressed });

  useEffect(() => {
    openCollection(collectionId);
  }, [collectionId]);

  useEffect(() => {
    setCanvasToDisplay(canvas);
  }, [collectionId, canvas?.canvas.id]);

  useEffect(() => {
    if (canvasToDisplay !== null) {
      setScope({ canvasId: canvasToDisplay.canvas.id, collectionId });
    }
  }, [canvasToDisplay]);

  const currentCollectionScope = useMemo(
    () => ({
      collectionId,
    }),
    [collectionId],
  );

  return (
    <section className='h-full max-h-full w-full max-w-full'>
      <ResizablePanelGroup direction='horizontal'>
        <ResizablePanel className='mr-1 flex min-h-0 min-w-0' minSize={30}>
          {collection ? (
            <div className='flex h-full max-h-full w-full max-w-full flex-col gap-2'>
              <CollectionInspectorHeader {...collection} />
              {collection.content.length > 0 && (
                <div className='flex w-full items-center justify-between'>
                  {isWorkerRunning ? (
                    <div className='flex items-center gap-2'>
                      <strong>{t('info_worker_running')}</strong>
                      <CollectionWorkerCounters collectionId={collectionId} />
                    </div>
                  ) : (
                    <CollectionToolbar collection={collection} />
                  )}
                  <div className='flex items-center gap-2'>
                    <OcrStatus collectionId={collectionId} />
                    <LlmStatus collectionId={collectionId} />
                    <ResultsAvailable scope={currentCollectionScope} />
                  </div>
                </div>
              )}
              {collection.contentSize > 0 ? (
                <CollectionInspectorGallery
                  collection={collection}
                  canvases={canvases}
                  canvasToDisplay={canvasToDisplay}
                  setCanvasToDisplay={setCanvasToDisplay}
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center text-muted-foreground'>
                  {t('info_empty_collection')}
                </div>
              )}
            </div>
          ) : (
            <div className='p-4 text-center text-muted-foreground'>
              {t('info_empty_collection')}
            </div>
          )}
        </ResizablePanel>
        <ResizableHandle withHandle className='w-1 cursor-col-resize bg-dark-slate-gray' />
        <ResizablePanel className='ml-1 flex-1 overflow-hidden' minSize={30}>
          {canvasToDisplay === null ? (
            <div className='panel flex h-full w-full items-center justify-center text-2xl text-red-500'>
              {t('info_no_canvas_selected')}
            </div>
          ) : (
            <div className='flex h-full w-full flex-col'>
              <CanvasViewer
                collectionId={collectionId}
                sourceId={canvasToDisplay.sourceId}
                canvas={canvasToDisplay.canvas}
                setCanvasToDisplay={setCanvasToDisplay}
              />
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </section>
  );
};

export default CollectionInspectorContent;
