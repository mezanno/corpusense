import CanvasViewer from '@/components/canvasViewer/CanvasViewer';
import CollectionToolbar from '@/components/CollectionToolbar';
import CollectionMetadataForm from '@/components/forms/CollectionMetadataForm';
import GridThumb from '@/components/GridThumb';
import {
  AnnotationContextProvider,
  useAnnotationContext,
} from '@/components/reducers/AnnotationContext';
import { useCollectionContext } from '@/components/reducers/CollectionContext';
import TextViewer from '@/components/textviewer/TextViewer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollectionContent } from '@/hooks/data/collections/useCollectionContent';
import { Canvas } from '@iiif/presentation-3';
import { useVirtualizer } from '@tanstack/react-virtual';
import 'gridstack/dist/gridstack.min.css';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';
import AutoSizer from 'react-virtualized-auto-sizer';

const CollectionInspectorContent = ({
  collectionId,
  canvasId,
}: {
  collectionId: string;
  canvasId: string | null;
}) => {
  const { t } = useTranslation();
  const { collection, getCanvasById } = useCollectionContent(collectionId);
  const { openCollection } = useCollectionContext();
  const { setScope } = useAnnotationContext();
  const canvas = canvasId !== null ? getCanvasById(canvasId) : null;
  const [canvasToDisplay, setCanvasToDisplay] = useState<Canvas | null>(canvas);
  const [activeTab, setActiveTab] = useState('document');

  const [colCount, setColCount] = useState(5);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    openCollection(collectionId);
  }, [collectionId]);

  useEffect(() => {
    setCanvasToDisplay(canvas);
  }, [collectionId, canvas]);

  useEffect(() => {
    if (canvasToDisplay !== null) {
      setScope({ canvasId: canvasToDisplay.id, collectionId });
    }
  }, [canvasToDisplay]);

  // calcule les lignes en fonction des colonnes
  const rowCount = Math.ceil(collection?.contentSize ?? 0 / colCount);

  /** Virtualizer vertical (pour les lignes) */
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    gap: 10,
    count: rowCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 165 + 10, // hauteur de ligne
    overscan: 2,
  });

  /** Virtualizer horizontal (pour les colonnes) */
  const colVirtualizer = useVirtualizer({
    gap: 10,
    horizontal: true,
    count: colCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 100, // largeur (sera mise à jour dynamiquement)
    overscan: 2,
  });

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
                {collection.contentSize > 0 ? (
                  <AutoSizer
                    onResize={(size) => {
                      setColCount(Math.max(2, Math.floor(size.width / 115)));
                    }}
                  >
                    {({ width, height }) => {
                      return (
                        <div
                          ref={containerRef}
                          style={{
                            width,
                            height,
                            overflow: 'auto',
                            position: 'relative',
                          }}
                        >
                          <div
                            className='m-2'
                            style={{
                              height: `${rowVirtualizer.getTotalSize()}px`,
                              width: `${colVirtualizer.getTotalSize()}px`,
                              position: 'relative',
                            }}
                          >
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                              <Fragment key={virtualRow.key}>
                                {colVirtualizer.getVirtualItems().map((virtualColumn) => {
                                  const index = virtualRow.index * colCount + virtualColumn.index;
                                  if (index >= collection.contentSize) return null;
                                  return (
                                    <div
                                      key={`${virtualRow.key}-${virtualColumn.key}`}
                                      style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: `${virtualColumn.size}px`,
                                        height: `${virtualRow.size}px`,
                                        transform: `translateX(${virtualColumn.start}px) translateY(${virtualRow.start}px)`,
                                      }}
                                    >
                                      <GridThumb
                                        canvasId={collection.content[index].canvasId}
                                        collectionId={collection.id ?? ''}
                                        thumbWidth={virtualColumn.size}
                                        thumbHeight={virtualRow.size}
                                        setCanvasToDisplay={setCanvasToDisplay}
                                        canvasToDisplay={canvasToDisplay}
                                      />
                                    </div>
                                  );
                                })}
                              </Fragment>
                            ))}
                          </div>
                        </div>
                      );
                    }}
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
  const { collectionId } = useParams();
  const [searchParams] = useSearchParams();

  const canvasId = useMemo(() => {
    return searchParams.get('canvas');
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
