import { useAnnotationContext } from '@/components/reducers/AnnotationContext';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { ElementType } from '@/data/models/annotations/annotation';
import { CanvasWithSourceId } from '@/hooks/data/collections/useCollectionContent';
import useDialog from '@/hooks/ui/useDialog';
import { useSortable } from '@dnd-kit/react/sortable';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CollectionInspectorGalleryItemContent from './CollectionInspectorGalleryItemContent';

const CollectionInspectorGalleryItem = ({
  canvasWithSourceId,
  collectionId,
  collectionContentIndex,
  colSize,
  setCanvasToDisplay,
  canvasToDisplay,
}: {
  canvasWithSourceId: CanvasWithSourceId;
  collectionId: string;
  collectionContentIndex: number;
  colSize: number;
  canvasToDisplay: CanvasWithSourceId | null;
  setCanvasToDisplay: (canvas: CanvasWithSourceId | null) => void;
}) => {
  const { t } = useTranslation();
  const { openDuplicateLayoutDialog } = useDialog();
  const { getAnnotationsByTypes } = useAnnotationContext();

  const regionAnnotations = getAnnotationsByTypes([ElementType.TEXT_REGION]);

  const [element, setElement] = useState<HTMLSpanElement | null>(null);
  // element must be the ContextMenuTrigger span, since it's the actual grid child dnd-kit reorders, not the nested item div
  const { isDragging } = useSortable({
    id: canvasWithSourceId.canvas.id,
    index: collectionContentIndex,
    element,
  });

  const handleDuplicateLayout = () => {
    openDuplicateLayoutDialog({
      canvasId: canvasWithSourceId.canvas.id,
      collectionId,
    });
  };

  return (
    <>
      {/* modal={false} : fix a bug with the Dialog+ContextMenu : https://github.com/radix-ui/primitives/issues/1836 */}
      <ContextMenu modal={false}>
        <ContextMenuTrigger ref={setElement}>
          <CollectionInspectorGalleryItemContent
            canvasWithSourceId={canvasWithSourceId}
            collectionId={collectionId}
            collectionContentIndex={collectionContentIndex}
            thumbWidth={colSize}
            thumbHeight={150}
            setCanvasToDisplay={setCanvasToDisplay}
            canvasToDisplay={canvasToDisplay}
            isDragging={isDragging}
          />
        </ContextMenuTrigger>
        <ContextMenuContent>
          {regionAnnotations.length > 0 && (
            <ContextMenuItem onClick={handleDuplicateLayout}>
              {t('btn_duplicate_regions')}
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
};

export default CollectionInspectorGalleryItem;
