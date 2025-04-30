import CanvasViewer from '@/components/CanvasViewer';
import CollectionMetadataForm from '@/components/CollectionMetadataForm';
import CollectionToolbar from '@/components/CollectionToolbar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { setCanvasFromComponent } from '@/state/reducers/canvas';
import {
  addCollectionToHistoryRequest,
  removeElementFromCollectionRequest,
} from '@/state/reducers/collections';
import { WorkerStatus } from '@/state/reducers/workers';
import { getCanvasById } from '@/state/selectors/storedItems';
import { getWorker } from '@/state/selectors/workers';
import { Canvas, IIIFExternalWebResource } from '@iiif/presentation-3';
import { Thumbnail } from '@samvera/clover-iiif/primitives';
import { GridStack } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import { CircleX } from 'lucide-react';
import { createRef, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { BarLoader, ClockLoader } from 'react-spinners';

const CANVASVIEWER_NAME = 'collection-inspector';

const GridThumb = ({
  canvasId,
  collectionId,
  canvasViewerName,
}: {
  canvasId: string;
  collectionId: string;
  canvasViewerName: string;
}) => {
  const canvas = useAppSelector((state) => getCanvasById(state, canvasId)) as Canvas;
  const worker = useAppSelector((state) => getWorker(state, canvasId));
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const handleOnClick = () => {
    if (canvas !== undefined) {
      dispatch(setCanvasFromComponent({ componentId: canvasViewerName, canvas, collectionId }));
    }
  };

  const handleDelete = useCallback(() => {
    console.log('Delete', canvasId);
    dispatch(removeElementFromCollectionRequest({ collectionId: collectionId, canvasId }));
  }, [canvasId]);

  if (canvas === undefined) {
    return <div aria-errormessage='Error while loading canvas'>Error while loading canvas</div>;
  }
  const thumbnail = canvas.thumbnail as IIIFExternalWebResource[];

  return (
    <div className='group relative' onClick={handleOnClick}>
      <Thumbnail
        thumbnail={thumbnail}
        style={{ width: '100px', height: '100px', objectFit: 'contain' }}
        className='w-fit'
        aria-label='canvas thumbnail'
      />
      <button
        className='absolute top-0 right-0 flex items-center justify-center opacity-0 group-hover:opacity-100'
        title={t('btn_delete_collection')}
      >
        <CircleX className='text-red-400 hover:text-red-800' onClick={handleDelete} />
      </button>

      {worker !== undefined && worker?.status == WorkerStatus.PENDING && (
        <div className='absolute inset-0 flex items-center justify-center'>
          {/* <CalendarClock size={'small'} width={28} /> */}
          <BarLoader width={25} />
        </div>
      )}

      {worker !== undefined && worker?.status == WorkerStatus.PROCESSING && (
        <div className='absolute inset-0 flex items-center justify-center'>
          {/* <Spinner size={'small'} /> */}
          <ClockLoader size={24} />
        </div>
      )}
    </div>
  );
};

const CollectionInspectorContent = ({ collectionId }: { collectionId: string }) => {
  const activeCollection = useAppSelector((state) =>
    state.collections.values.find((elt) => elt.id === collectionId),
  );

  const gridRef = useRef(null);
  const refs = useRef<{ [key: string]: React.RefObject<HTMLDivElement | null> }>({});

  const { t } = useTranslation();

  if (activeCollection?.content) {
    if (Object.keys(refs.current).length !== activeCollection.content.length) {
      activeCollection.content.forEach(({ canvasId }) => {
        if (!(canvasId in refs.current)) {
          refs.current[canvasId] = createRef();
        }
      });
    }
  }

  useEffect(() => {
    if (activeCollection?.content && gridRef.current !== null) {
      const grid = GridStack.init(
        { float: false, disableResize: true, disableDrag: true },
        gridRef.current,
      );
      grid.on('change', (_event, _items) => {
        grid.compact();
      });

      grid.batchUpdate(); //afin d'éviter les rendus tant qu'on n'a pas terminé les makeWidgets
      grid.removeAll();
      activeCollection.content.forEach(({ canvasId }, index) => {
        const item = refs.current[canvasId].current;
        const x = index % 12;
        const y = Math.floor(index / 12);
        if (item !== null) {
          item.setAttribute('data-gs-x', x.toString());
          item.setAttribute('data-gs-y', y.toString());
          item.setAttribute('data-gs-width', '1');
          item.setAttribute('data-gs-height', '1');
          grid.makeWidget(item);
        }
      });
      grid.batchUpdate(false); //on termine les makeWidgets
    }
  }, [activeCollection]);

  return (
    <section className='h-full max-h-full w-full max-w-full'>
      {activeCollection && (
        <div className='flex h-full max-h-full w-full max-w-full flex-col gap-2'>
          <Accordion
            asChild
            className='panel'
            type='single'
            collapsible
            defaultValue='metadata' //this open the metadata by default
          >
            <AccordionItem value='metadata'>
              <AccordionTrigger className='mx-2'>
                <h2 className='flex gap-2 text-lg'>
                  {t('title_metadata_collection')}
                  <span className='font-bold italic'>{activeCollection.name}</span>
                  <span className='font-thin'>({activeCollection.id})</span>
                </h2>
              </AccordionTrigger>
              <AccordionContent>
                <CollectionMetadataForm collection={activeCollection} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <CollectionToolbar collectionId={collectionId} />
          {activeCollection?.content.length > 0 ? (
            <div className='panel h-full w-full overflow-hidden'>
              <ResizablePanelGroup direction='horizontal'>
                <ResizablePanel className='flex' minSize={30}>
                  <div className='flex w-fit flex-wrap items-start gap-2 overflow-y-auto'>
                    {activeCollection.content.map((item) => (
                      <div
                        key={item.canvasId}
                        ref={refs.current[item.canvasId]}
                        className='flex items-center justify-center'
                      >
                        <GridThumb
                          canvasId={item.canvasId}
                          collectionId={activeCollection.id as string}
                          canvasViewerName={CANVASVIEWER_NAME}
                        />
                      </div>
                    ))}
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel className='flex-1 overflow-hidden' minSize={30}>
                  <CanvasViewer name={CANVASVIEWER_NAME} colllectionId={collectionId} />
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          ) : (
            <div className='p-4 text-center text-muted-foreground'>
              {t('info_empty_collection')}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

const CollectionInspectorPage = () => {
  const { t } = useTranslation();
  const { collectionId } = useParams();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (collectionId !== undefined) {
      console.log('CollectionInspectorPage', collectionId);

      dispatch(addCollectionToHistoryRequest(collectionId));
      // dispatch(reset());
    }
  }, [collectionId]);

  return collectionId === undefined ? (
    <div className='flex justify-center'>{t('error_id_collection_invalid')}</div>
  ) : (
    <CollectionInspectorContent collectionId={collectionId} />
  );
};

export default CollectionInspectorPage;
