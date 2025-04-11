import CanvasViewer from '@/components/CanvasViewer';
import CollectionMetadaForm from '@/components/CollectionMetadaForm';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { setCanvasFromComponent } from '@/state/reducers/canvas';
import { removeElementFromCollection, setActiveCollection } from '@/state/reducers/collections';
import { getCanvasById } from '@/state/selectors/storedItems';
import { Canvas, IIIFExternalWebResource } from '@iiif/presentation-3';
import { Thumbnail } from '@samvera/clover-iiif/primitives';
import { GridStack } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import { CircleX } from 'lucide-react';
import { createRef, useCallback, useEffect, useRef } from 'react';
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
  const dispatch = useAppDispatch();

  const handleOnClick = () => {
    if (canvas !== undefined) {
      dispatch(setCanvasFromComponent({ componentId: canvasViewerName, canvas }));
    }
  };

  const handleDelete = useCallback(() => {
    console.log('Delete', canvasId);
    dispatch(removeElementFromCollection({ collectionId: collectionId, canvasId }));
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
      />
      <div className='absolute top-0 right-0 flex items-center justify-center opacity-0 group-hover:opacity-100'>
        <CircleX className='text-red-400 hover:text-red-800' onClick={handleDelete} />
      </div>
    </div>
  );
};

const CollectionInspectorContent = ({ collectionid }: { collectionid: string }) => {
  const activeCollection = useAppSelector((state) =>
    state.collections.values.find((elt) => elt.id === collectionid),
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
      console.log('compute grid');

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
    <div className='flex h-full w-full flex-col space-y-2'>
      {activeCollection && (
        <>
          <Accordion
            className='rounded-md border bg-white'
            type='single'
            collapsible
            defaultValue='metadata' //this open the metadata by default
          >
            <AccordionItem value='metadata'>
              <AccordionTrigger className='mr-2 ml-2'>
                {t('title_metadata_collection')}
              </AccordionTrigger>
              <AccordionContent>
                <CollectionMetadaForm collection={activeCollection} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          {/* {activeList?.content ? (
              <div ref={gridRef} className='grid-stack flex h-max rounded-md border bg-white'>
                {activeList.content.map((item) => (
                  <div
                    key={item.canvasId}
                    ref={refs.current[item.canvasId]}
                    className='grid-stack-item'
                  >
                    <div className='grid-stack-item-content flex items-center justify-center'>
                      <GridThumb canvasId={item.canvasId} listId={activeList.id as string} />
                    </div>
                  </div>
                ))}
              </div> */}
          {activeCollection?.content ? (
            <ResizablePanelGroup
              direction='horizontal'
              className='h-fit flex-1 space-x-2 rounded-md border bg-white'
            >
              <ResizablePanel className='h-full w-full' minSize={30}>
                <div className='m-2 grid grid-cols-8'>
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
              <ResizablePanel className='h-full w-full' minSize={30}>
                <CanvasViewer name={CANVASVIEWER_NAME} editable={true} />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div>{t('info_empty_collection')}</div>
          )}
        </>
      )}
    </div>
  );
};

const CollectionInspectorPage = () => {
  const { t } = useTranslation();
  const { collectionId } = useParams();
  const dispatch = useAppDispatch();

  if (collectionId !== undefined) {
    dispatch(setActiveCollection(collectionId));
  }

  return collectionId === undefined ? (
    <div>{t('error_id_collection_invalid')}</div>
  ) : (
    <CollectionInspectorContent collectionid={collectionId} />
  );
};

export default CollectionInspectorPage;
