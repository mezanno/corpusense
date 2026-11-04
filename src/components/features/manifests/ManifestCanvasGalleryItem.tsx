import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Canvas } from '@iiif/presentation-3';

import Loading from '@/components/common/Loading';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getLabel } from '@/data/utils/canvas';
import { useCollections } from '@/hooks/data/collections/useCollections';
import useThumbnail from '@/hooks/data/sources/useThumbnail';
import useDialog from '@/hooks/ui/useDialog';
import { useCanvasSelection } from '@/hooks/useCanvasSelection';
import { truncateMiddle } from '@/utils/utils';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ManifestCanvasGalleryItemProps {
  index: number;
  canvas: Canvas;
  sourceId: string;
  thumbWidth: number;
  thumbHeight: number;
  canvasToDisplay: Canvas | null;
  setCanvasToDisplay: (canvas: Canvas) => void;
}

const ManifestCanvasGalleryItem = ({
  index,
  canvas,
  sourceId,
  thumbWidth,
  thumbHeight,
  setCanvasToDisplay,
  canvasToDisplay,
}: ManifestCanvasGalleryItemProps) => {
  const { t } = useTranslation();
  const { collections, addSelectionToCollection } = useCollections();
  const {
    isSelected,
    hasSelectedElements,
    getSelectedCanvases,
    getSelectionCount,
    setSelectionEnd,
    setSelectionStart,
    setSelection,
  } = useCanvasSelection();

  const { openNewCollectionDialog } = useDialog();
  const [search, setSearch] = useState<string>('');
  const [loadedThumbUrl, setLoadedThumbUrl] = useState<string | undefined>(undefined);
  const imgRef = useRef<HTMLImageElement>(null);

  const filteredCollections = useMemo(() => {
    return collections.filter((col) => col.name.toLowerCase().includes(search.toLowerCase()));
  }, [collections, search]);

  const { thumbnail, isLoading, error } = useThumbnail({ canvas, sourceId });

  const thumbUrl = thumbnail?.[0]?.id;
  const isImgLoaded = thumbUrl !== undefined && loadedThumbUrl === thumbUrl;

  const handleSetSelectionStart = useCallback(() => {
    setSelectionStart(index);
  }, [index, setSelectionStart]);

  const handleSetSelectionEnd = useCallback(() => {
    setSelectionEnd(index);
  }, [index, setSelectionEnd]);

  const handleResetSelection = useCallback(() => {
    setSelection([]);
  }, [setSelection]);

  const handleAddSelectionToCollection = useCallback(
    (collectionId: string | undefined) => {
      void (async () => {
        if (collectionId === undefined) return;

        await addSelectionToCollection({
          selection: getSelectedCanvases(),
          collectionId,
          sourceId,
        });
      })();
    },
    [addSelectionToCollection, getSelectedCanvases, sourceId],
  );

  const handleOnClick = useCallback(() => {
    setCanvasToDisplay(canvas);
  }, [canvas, setCanvasToDisplay]);

  const handleCopyToClipboard = useCallback(() => {
    if (canvas.items !== undefined) {
      const body = canvas.items?.[0]?.items?.[0]?.body;
      if (body !== undefined && typeof body !== 'string' && 'id' in body && body.id !== undefined) {
        void navigator.clipboard.writeText(body.id);
      }
    }
  }, [canvas.items]);

  const handleCreateCollection = useCallback(() => {
    openNewCollectionDialog({ selection: getSelectedCanvases(), sourceId });
  }, [openNewCollectionDialog, getSelectedCanvases, sourceId]);

  const idDisplayed = canvasToDisplay?.id === canvas?.id;
  const match = canvas.id.match(/f\d+/);
  const canvasItemId = match ? match[0] : '';
  const itemIsSelected = isSelected(index);

  const handleImgLoad = useCallback(() => {
    setLoadedThumbUrl(thumbUrl);
  }, [thumbUrl]);

  const handleImgError = useCallback(() => {
    setLoadedThumbUrl(undefined);
  }, []);

  return (
    <>
      {/* modal={false} : fix a bug with the Dialog+ContextMenu : https://github.com/radix-ui/primitives/issues/1836 */}
      <ContextMenu modal={false}>
        <div className='no-select flex h-full w-full justify-center' draggable={false}>
          <ContextMenuTrigger>
            <div
              className={`group flex h-fit w-fit cursor-pointer flex-col items-center rounded-md p-1 shadow transition duration-200 hover:scale-105 ${idDisplayed ? 'bg-saffron-400' : 'bg-saffron-900'} ${itemIsSelected ? 'ring-3 ring-saffron-300' : ''} selectable-item`}
              style={{ width: `${thumbWidth}px`, height: `${thumbHeight}px` }}
              onClick={handleOnClick}
              data-index={index}
              data-canvas-id={canvas.id}
              role='listitem'
            >
              {error !== null ? (
                <div className='text-sm text-red-400'>{error}</div>
              ) : (
                <div className='relative flex h-full w-full flex-1 items-center justify-center overflow-hidden p-1'>
                  {(!isImgLoaded || isLoading || thumbnail === null) && (
                    <div className='absolute inset-0 z-10 flex items-center justify-center rounded-md bg-saffron-900 p-2'>
                      <Loading />
                    </div>
                  )}
                  {thumbUrl !== undefined && (
                    <img
                      ref={imgRef}
                      src={thumbUrl}
                      alt={canvas.label ? getLabel(canvas) : 'canvas thumbnail'}
                      loading='lazy'
                      decoding='async'
                      onLoad={handleImgLoad}
                      onError={handleImgError}
                      className={`max-h-full max-w-full object-contain transition-opacity duration-200 ${isImgLoaded && !isLoading ? 'opacity-100' : 'opacity-0'}`}
                      draggable={false}
                    />
                  )}
                </div>
              )}
              <div className='flex w-full justify-between p-1 text-xs'>
                {canvas.label !== undefined && canvas.label !== null && (
                  <span>{truncateMiddle(getLabel(canvas))}</span>
                )}
                <span className='text-dark-slate-gray-300 italic'>{canvasItemId}</span>
              </div>
            </div>
          </ContextMenuTrigger>
        </div>

        <ContextMenuContent>
          {hasSelectedElements() && (
            <>
              <ContextMenuItem onClick={handleCreateCollection}>
                {t('menu_create_from_selection')}
              </ContextMenuItem>
              {collections?.length > 0 && (
                <ContextMenuSub>
                  <ContextMenuSubTrigger>
                    {t('menu_add_selection_to_collection')}
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    <div className='p-2'>
                      <input
                        type='text'
                        placeholder={t('form_placeholder_search_collection')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className='w-full rounded-md border px-2 py-1 text-sm'
                        autoFocus={true}
                      />
                    </div>
                    <ScrollArea className='h-96'>
                      {filteredCollections.map((col) => (
                        <ContextMenuItem
                          key={col.id}
                          onClick={() => handleAddSelectionToCollection(col.id)}
                        >
                          {col.name}
                        </ContextMenuItem>
                      ))}
                      {filteredCollections.length === 0 && (
                        <div className='p-2 text-sm text-muted-foreground'>
                          {t('info_no_results')}
                        </div>
                      )}
                    </ScrollArea>
                  </ContextMenuSubContent>
                </ContextMenuSub>
              )}
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem onClick={handleSetSelectionStart}>
            {t('menu_define_start')}
          </ContextMenuItem>
          <ContextMenuItem onClick={handleSetSelectionEnd}>{t('menu_define_end')}</ContextMenuItem>
          {hasSelectedElements() && (
            <>
              <ContextMenuSeparator />

              <ContextMenuItem onClick={handleResetSelection}>
                {t('menu_reset_selection')}
              </ContextMenuItem>
            </>
          )}
          {getSelectionCount() <= 1 && (
            <>
              <ContextMenuSeparator />

              <ContextMenuItem onClick={handleCopyToClipboard}>
                {t('menu_copy_clipboard')}
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
};

export default memo(ManifestCanvasGalleryItem);
