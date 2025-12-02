import CanvasViewer from '@/components/canvasViewer/CanvasViewer';
import CollectionToolbar from '@/components/CollectionToolbar';
import CollectionMetadataForm from '@/components/forms/CollectionMetadataForm';
import GridThumb from '@/components/GridThumb';
import {
  AnnotationContextProvider,
  useAnnotationContext,
} from '@/components/reducers/AnnotationContext';
import TextViewer from '@/components/textviewer/TextViewer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collection } from '@/data/models/Collection';
import { useCollectionContent } from '@/hooks/data/collections/useCollectionContent';
import { useAppDispatch } from '@/hooks/hooks';
import { loadCollectionRequest } from '@/state/reducers/collections';
import { Canvas } from '@iiif/presentation-3';
import 'gridstack/dist/gridstack.min.css';
import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeGrid as Grid } from 'react-window';

interface GridCellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    collection: Collection;
    width: number;
    height: number;
    colCount: number;
    canvasToDisplay: Canvas | null;
    setCanvasToDisplay: (canvas: Canvas | null) => void;
  };
}

const GridCell: FC<GridCellProps> = ({ columnIndex, rowIndex, style, data }) => {
  const index = rowIndex * data.colCount + columnIndex;
  //we return an empty div if the index is out of bounds
  //this is to avoid the error "index out of bounds" when using react-window
  if (index >= data.collection.content.length) {
    return <div style={style} />;
  }

  return (
    <div
      className={`${
        columnIndex % 2
          ? rowIndex % 2 === 0
            ? 'GridItemOdd'
            : 'GridItemEven'
          : rowIndex % 2
            ? 'GridItemOdd'
            : 'GridItemEven'
      }`}
      style={style}
    >
      <GridThumb
        canvasId={data.collection.content[index].canvasId}
        collectionId={data.collection.id ?? ''}
        thumbWidth={data.width}
        thumbHeight={data.height}
        setCanvasToDisplay={data.setCanvasToDisplay}
        canvasToDisplay={data.canvasToDisplay}
      />
    </div>
  );
};

const CollectionInspectorContent = ({
  collectionId,
  canvasId,
}: {
  collectionId: string;
  canvasId: string | null;
}) => {
  const { t } = useTranslation();
  const { collection, getCanvasById } = useCollectionContent(collectionId);
  const { setScope } = useAnnotationContext();
  const canvas = canvasId !== null ? getCanvasById(canvasId) : null;
  const [canvasToDisplay, setCanvasToDisplay] = useState<Canvas | null>(canvas);
  const [activeTab, setActiveTab] = useState('document');
  const [colCount, setColCount] = useState(6);

  useEffect(() => {
    setCanvasToDisplay(canvas);
  }, [collectionId, canvas]);

  useEffect(() => {
    if (canvasToDisplay !== null) {
      // appDispatch(loadEntitiesRequest({ canvasId: canvasToDisplay.id, collectionId }));
      setScope({ canvasId: canvasToDisplay.id, collectionId });
    }
  }, [canvasToDisplay]);

  const handleOnResize = (size: { height: number; width: number }) => {
    if (size.width < 200) {
      setColCount(3);
    } else if (size.width < 800) {
      setColCount(4);
    } else if (size.width < 1000) {
      setColCount(5);
    } else if (size.width < 1200) {
      setColCount(6);
    } else {
      setColCount(7);
    }
  };

  return (
    <section className='h-full max-h-full w-full max-w-full'>
      <ResizablePanelGroup direction='horizontal'>
        <ResizablePanel className='mr-1 flex min-h-0 min-w-0' minSize={30}>
          {collection ? (
            <div className='flex h-full max-h-full w-full max-w-full flex-col gap-2'>
              <Accordion
                asChild
                className='panel flex-col'
                type='single'
                collapsible
                defaultValue='metadata' //this open the metadata by default
              >
                <AccordionItem value='metadata'>
                  <AccordionTrigger className='mx-2'>
                    <h2 className='flex gap-2 text-lg'>
                      {t('title_metadata_collection')}
                      <span className='font-bold italic'>{collection.name}</span>
                      <span className='font-thin'>({collection.id})</span>
                    </h2>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CollectionMetadataForm collection={collection} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              {collection.content.length > 0 && <CollectionToolbar collection={collection} />}
              <div className='panel h-full w-full overflow-hidden'>
                {collection.content.length > 0 ? (
                  <AutoSizer role='list' onResize={handleOnResize}>
                    {({ height, width }) => (
                      <Grid
                        columnCount={colCount}
                        columnWidth={width / colCount}
                        height={height}
                        rowCount={Math.ceil(collection.content.length / colCount)}
                        rowHeight={175}
                        width={width}
                        itemData={{
                          collection,
                          width: width / colCount - 20,
                          height: 165,
                          setCanvasToDisplay,
                          canvasToDisplay,
                          colCount: colCount,
                        }}
                      >
                        {GridCell}
                      </Grid>
                    )}
                  </AutoSizer>
                ) : (
                  <div className='flex h-full w-full items-center justify-center text-muted-foreground'>
                    {t('info_empty_collection')}
                  </div>
                )}
              </div>
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
              </div>
              <TabsContent value='document'>
                <CanvasViewer collectionId={collectionId} canvas={canvasToDisplay} />
              </TabsContent>
              <TabsContent value='text'>
                <TextViewer collectionId={collectionId} canvas={canvasToDisplay} />
              </TabsContent>
            </Tabs>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </section>
  );
};

const CollectionInspectorPage = () => {
  const { t } = useTranslation();
  const [canvasId, setCanvasId] = useState<string | null>(null);
  const { collectionId } = useParams();
  const [searchParams] = useSearchParams();
  console.log('searchParams: ', searchParams);

  const dispatch = useAppDispatch();
  console.log('CollectionInspectorPage collectionId: ', collectionId);
  console.log('CollectionInspectorPage - Canvas ', canvasId);

  useEffect(() => {
    console.log('CollectionInspectorPage collectionId - useEffect: ', collectionId);
    if (collectionId !== undefined) {
      dispatch(loadCollectionRequest(collectionId));
    }
  }, [collectionId]);

  useEffect(() => {
    console.log('searchParams: ', searchParams.get('canvas'));
    if (searchParams.get('canvas') !== null) {
      setCanvasId(searchParams.get('canvas'));
    }
  }, [searchParams]);

  return collectionId === undefined ? (
    <div className='flex justify-center'>{t('error_id_collection_invalid')}</div>
  ) : (
    <AnnotationContextProvider>
      <CollectionInspectorContent collectionId={collectionId} canvasId={canvasId} />
    </AnnotationContextProvider>
  );
};

export default CollectionInspectorPage;
