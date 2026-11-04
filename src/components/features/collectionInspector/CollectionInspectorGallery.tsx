import { Collection } from '@/data/models/collection/collection';
import useCollectionActions from '@/hooks/data/collections/useCollectionActions';
import { CanvasWithSourceId } from '@/hooks/data/collections/useCollectionContent';
import { useAppDispatch } from '@/hooks/hooks';
import { pushError } from '@/state/reducers/events';
import { getErrorMessage } from '@/utils/utils';
import { isSortable } from '@dnd-kit/dom/sortable';
import { DragDropProvider, DragEndEvent } from '@dnd-kit/react';
import 'gridstack/dist/gridstack.min.css';
import { useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import CollectionInspectorGalleryItem from './CollectionInspectorGalleryItem';

type Props = {
  collection: Collection;
  canvases: CanvasWithSourceId[];
  setCanvasToDisplay: (canvas: CanvasWithSourceId | null) => void;
  canvasToDisplay: CanvasWithSourceId | null;
};

const CollectionInspectorGallery = (props: Props) => {
  const appDispatch = useAppDispatch();
  const { collection, canvases, setCanvasToDisplay, canvasToDisplay } = props;
  const [colCount, setColCount] = useState(5);
  const { swapCollectionElements } = useCollectionActions(collection.id);

  const handleDragEnd = (event: DragEndEvent) => {
    console.log(event);
    if (!event.canceled) {
      const { source } = event.operation;
      if (isSortable(source)) {
        const { initialIndex, index } = source;
        void (async () => {
          if (index !== initialIndex) {
            const swapResult = await swapCollectionElements(initialIndex, index);
            if (!swapResult.ok) {
              appDispatch(pushError(getErrorMessage(swapResult.error)));
            }
          }
        })();
      }
    }
  };

  return (
    <div className='h-full min-h-0 overflow-y-auto'>
      <AutoSizer
        disableHeight
        onResize={(size) => {
          setColCount(Math.max(2, Math.floor(size.width / 115)));
        }}
      >
        {({ width }) => {
          const gap = 10;
          const gridWidth = Math.min(width, 900) - 30;
          const colSize = (gridWidth - gap * (colCount - 1)) / colCount;
          return (
            <DragDropProvider onDragEnd={handleDragEnd}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${colCount}, 1fr)`,
                  gridAutoRows: 150,
                  gap: 10,
                  width: gridWidth,
                  margin: '0 auto',
                }}
              >
                {canvases.map((item, index) => (
                  <CollectionInspectorGalleryItem
                    key={item.canvas.id}
                    canvasWithSourceId={item}
                    collectionId={collection.id}
                    collectionContentIndex={index}
                    colSize={colSize}
                    setCanvasToDisplay={setCanvasToDisplay}
                    canvasToDisplay={canvasToDisplay}
                  />
                ))}
              </div>
            </DragDropProvider>
          );
        }}
      </AutoSizer>
    </div>
  );
};

export default CollectionInspectorGallery;
