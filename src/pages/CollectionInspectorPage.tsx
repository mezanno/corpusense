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
import { reset } from '@/state/reducers/canvas';
import { addCollectionToHistoryRequest } from '@/state/reducers/collections';
import 'gridstack/dist/gridstack.min.css';
import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeGrid as Grid } from 'react-window';

const CANVASVIEWER_NAME = 'collection-inspector';
const COLUMN_COUNT = 5;

interface GridCellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    collection: Collection;
    width: number;
    height: number;
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
        canvasViewerName={CANVASVIEWER_NAME}
        thumbWidth={data.width}
        thumbHeight={data.height}
      />
    </div>
  );
};

const CollectionInspectorContent = ({ collectionId }: { collectionId: string }) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const activeCollection = useAppSelector((state) =>
    state.collections.values.find((elt) => elt.id === collectionId),
  );

  const [activeTab, setActiveTab] = useState('document');

  useEffect(() => {
    appDispatch(reset('collection-inspector')); // Reset the canvas state when the component mounts
  }, []);

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
                <AutoSizer role='list'>
                  {({ height, width }) => (
                    <Grid
                      columnCount={COLUMN_COUNT}
                      columnWidth={width / COLUMN_COUNT}
                      height={height}
                      rowCount={Math.ceil(activeCollection.content.length / COLUMN_COUNT)}
                      rowHeight={175}
                      width={width}
                      itemData={{
                        collection: activeCollection,
                        width: width / COLUMN_COUNT - 20,
                        height: 165,
                      }}
                    >
                      {GridCell}
                    </Grid>
                  )}
                </AutoSizer>
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
