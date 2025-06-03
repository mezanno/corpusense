import CanvasViewer from '@/components/CanvasViewer';
import CollectionMetadataForm from '@/components/CollectionMetadataForm';
import CollectionToolbar from '@/components/CollectionToolbar';
import ModelButtons from '@/components/textviewer/ModelButtons';
import TextViewer from '@/components/textviewer/TextViewer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WorkerStatusIcon from '@/components/WorkerStatusIcon';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { reset, setCanvasFromComponent } from '@/state/reducers/canvas';
import {
  addCollectionToHistoryRequest,
  removeElementFromCollectionRequest,
} from '@/state/reducers/collections';
import { isCanvasDisplayed } from '@/state/selectors/canvas';
import { getCanvasById } from '@/state/selectors/storedItems';
import { Canvas, IIIFExternalWebResource } from '@iiif/presentation-3';
import { Thumbnail } from '@samvera/clover-iiif/primitives';
import { GridStack } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import { CircleX } from 'lucide-react';
import { createRef, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

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
  const idDisplayed = useAppSelector((state) =>
    isCanvasDisplayed(state, canvasId, canvasViewerName),
  );

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
    <div
      className={`group relative cursor-pointer rounded-md p-1 shadow transition hover:scale-110 ${idDisplayed ? 'bg-amber-400' : 'bg-amber-100'} `}
      onClick={handleOnClick}
    >
      <Thumbnail
        thumbnail={thumbnail}
        style={{ width: '100px', height: '100px', objectFit: 'contain' }}
        className='w-fit'
        aria-label='canvas thumbnail'
      />
      <button
        className='absolute top-0 right-0 flex cursor-pointer items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110'
        title={t('btn_delete_collection')}
      >
        <CircleX className='text-red-400 hover:text-red-800' onClick={handleDelete} />
      </button>

      <WorkerStatusIcon elementId={canvasId} />
    </div>
  );
};

const CollectionInspectorContent = ({ collectionId }: { collectionId: string }) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const activeCollection = useAppSelector((state) =>
    state.collections.values.find((elt) => elt.id === collectionId),
  );

  const gridRef = useRef(null);
  const refs = useRef<{ [key: string]: React.RefObject<HTMLDivElement | null> }>({});
  const [activeTab, setActiveTab] = useState('document');

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
    appDispatch(reset('collection-inspector')); // Reset the canvas state when the component mounts
  }, []);

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
      <ResizablePanelGroup direction='horizontal'>
        <ResizablePanel className='mr-1 flex' minSize={30}>
          {activeCollection ? (
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
              <div className='panel h-full w-full overflow-hidden'>
                <div className='flex h-full w-fit flex-wrap content-start items-start gap-2 overflow-y-auto'>
                  {activeCollection.content.map((item) => (
                    <div key={item.canvasId} ref={refs.current[item.canvasId]} className='flex p-1'>
                      <GridThumb
                        canvasId={item.canvasId}
                        collectionId={activeCollection.id as string}
                        canvasViewerName={CANVASVIEWER_NAME}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className='p-4 text-center text-muted-foreground'>
              {t('info_empty_collection')}
            </div>
          )}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel className='ml-1 flex-1 overflow-hidden' minSize={30}>
          <Tabs
            defaultValue='document'
            className='panel h-full w-full'
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <div className='flex w-full justify-between'>
              <TabsList>
                <TabsTrigger value='document'>Vue document</TabsTrigger>
                <TabsTrigger value='text'>Vue texte</TabsTrigger>
              </TabsList>
              {activeTab === 'text' && <ModelButtons />}
            </div>
            <TabsContent value='document'>
              <CanvasViewer name={CANVASVIEWER_NAME} colllectionId={collectionId} />
            </TabsContent>
            <TabsContent value='text'>
              <TextViewer name={CANVASVIEWER_NAME} collectionId={collectionId} />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </section>
  );
};

const CollectionInspectorPage = () => {
  const { t } = useTranslation();
  const { collectionId } = useParams();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (collectionId !== undefined) {
      dispatch(addCollectionToHistoryRequest(collectionId));
    }
  }, [collectionId]);

  return collectionId === undefined ? (
    <div className='flex justify-center'>{t('error_id_collection_invalid')}</div>
  ) : (
    <CollectionInspectorContent collectionId={collectionId} />
  );
};

export default CollectionInspectorPage;
