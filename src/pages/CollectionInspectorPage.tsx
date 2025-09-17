import CanvasViewer from '@/components/CanvasViewer';
import CollectionMetadataForm from '@/components/CollectionMetadataForm';
import CollectionToolbar from '@/components/CollectionToolbar';
import GridThumb from '@/components/GridThumb';
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
import { Collection } from '@/data/models/Collection';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { fetchAnnotationsRequest } from '@/state/reducers/annotations';
import { loadCollectionRequest } from '@/state/reducers/collections';
import { loadEntitiesRequest } from '@/state/reducers/namedEntities';
import { selectCurrentCollection } from '@/state/selectors/collections';
import { Canvas } from '@iiif/presentation-3';
import 'gridstack/dist/gridstack.min.css';
import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeGrid as Grid } from 'react-window';

const COLUMN_COUNT = 5;

interface GridCellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    collection: Collection;
    width: number;
    height: number;
    canvasToDisplay: Canvas | undefined;
    setCanvasToDisplay: (canvas: Canvas) => void;
  };
}

const GridCell: FC<GridCellProps> = ({ columnIndex, rowIndex, style, data }) => {
  const index = rowIndex * COLUMN_COUNT + columnIndex;
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

const CollectionInspectorContent = ({ collectionId }: { collectionId: string }) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const currentCollection = useAppSelector(selectCurrentCollection);
  const [canvasToDisplay, setCanvasToDisplay] = useState<Canvas | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('document');

  useEffect(() => {
    if (canvasToDisplay !== undefined) {
      appDispatch(fetchAnnotationsRequest({ canvasId: canvasToDisplay.id, collectionId }));
      appDispatch(loadEntitiesRequest({ canvasId: canvasToDisplay.id, collectionId }));
    }
  }, [canvasToDisplay]);

  return (
    <section className='h-full max-h-full w-full max-w-full'>
      <ResizablePanelGroup direction='horizontal'>
        <ResizablePanel className='mr-1 flex' minSize={30}>
          {currentCollection ? (
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
                      <span className='font-bold italic'>{currentCollection.name}</span>
                      <span className='font-thin'>({currentCollection.id})</span>
                    </h2>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CollectionMetadataForm collection={currentCollection} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              {currentCollection.content.length > 0 && (
                <CollectionToolbar collectionId={collectionId} />
              )}
              <div className='panel h-full w-full overflow-hidden'>
                {currentCollection.content.length > 0 ? (
                  <AutoSizer role='list'>
                    {({ height, width }) => (
                      <Grid
                        columnCount={COLUMN_COUNT}
                        columnWidth={width / COLUMN_COUNT}
                        height={height}
                        rowCount={Math.ceil(currentCollection.content.length / COLUMN_COUNT)}
                        rowHeight={175}
                        width={width}
                        itemData={{
                          collection: currentCollection,
                          width: width / COLUMN_COUNT - 20,
                          height: 165,
                          setCanvasToDisplay,
                          canvasToDisplay,
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
        <ResizableHandle withHandle />
        <ResizablePanel className='ml-1 flex-1 overflow-hidden' minSize={30}>
          {canvasToDisplay === undefined ? (
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
                {activeTab === 'text' && <ModelButtons collectionId={collectionId} />}
              </div>
              <TabsContent value='document'>
                <CanvasViewer colllectionId={collectionId} canvas={canvasToDisplay} />
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
  const { collectionId } = useParams();
  const dispatch = useAppDispatch();
  console.log('CollectionInspectorPage collectionId: ', collectionId);

  useEffect(() => {
    console.log('CollectionInspectorPage collectionId - useEffect: ', collectionId);
    if (collectionId !== undefined) {
      dispatch(loadCollectionRequest(collectionId));
    }
  }, [collectionId]);

  return collectionId === undefined ? (
    <div className='flex justify-center'>{t('error_id_collection_invalid')}</div>
  ) : (
    <CollectionInspectorContent collectionId={collectionId} />
  );
};

export default CollectionInspectorPage;
