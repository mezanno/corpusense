import { Canvas, IIIFExternalWebResource } from '@iiif/presentation-3';
import { Thumbnail } from '@samvera/clover-iiif/primitives';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './ui/context-menu';

import { getImageForThumbnail, getLabel, getObjectUrl } from '@/data/utils/canvas';
import { useCollections } from '@/hooks/data/collections/useCollections';
import useDialog from '@/hooks/ui/useDialog';
import { useCanvasSelection } from '@/hooks/useCanvasSelection';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ScrollArea } from './ui/scroll-area';

interface CanvasCardProps {
  index: number;
  canvas: Canvas;
  manifestId: string;
  thumbWidth: number;
  thumbHeight: number;
  canvasToDisplay: Canvas | null;
  setCanvasToDisplay: (canvas: Canvas) => void;
}

const CanvasCard = ({
  index,
  canvas,
  manifestId,
  thumbWidth,
  thumbHeight,
  setCanvasToDisplay,
  canvasToDisplay,
}: CanvasCardProps) => {
  const { t } = useTranslation();
  const { collections, addSelectionToCollection } = useCollections();
  const {
    isSelected,
    hasSelectedElements,
    getSelectedCanvases,
    setSelectionEnd,
    setSelectionStart,
    setSelection,
  } = useCanvasSelection();

  const [thumbnail, setThumbnail] = useState<IIIFExternalWebResource[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { openNewCollectionDialog } = useDialog();
  const [search, setSearch] = useState<string>('');

  const filteredCollections = useMemo(() => {
    return collections.filter((col) => col.name.toLowerCase().includes(search.toLowerCase()));
  }, [collections, search]);

  useEffect(() => {
    const fetchThumbnail = async () => {
      setError(null);
      const originalThumb = (canvas.thumbnail as IIIFExternalWebResource[]) ?? [
        getImageForThumbnail(canvas, 200),
      ];

      const thumb = [...originalThumb];
      const item = { ...thumb[0] };

      if (item !== null && item.id?.startsWith('http') === false) {
        try {
          item.id = await getObjectUrl(item.id);
        } catch (err) {
          console.error('Failed to get file for thumbnail:', err);
          setError(t('error_fsfile_not_found', { id: item.id }));
        }
      }

      thumb[0] = item;
      setThumbnail(thumb);
    };

    void fetchThumbnail();
  }, [canvas]);

  const handleSetSelectionStart = () => {
    setSelectionStart(index);
  };

  const handleSetSelectionEnd = () => {
    setSelectionEnd(index);
  };

  const handleResetSelection = () => {
    setSelection([]);
  };

  const handleAddSelectionToCollection = (collectionId: string | undefined) => {
    void (async () => {
      if (collectionId === undefined) return;

      await addSelectionToCollection({
        selection: getSelectedCanvases(),
        collectionId: collectionId,
        manifestId,
      });
    })();
  };

  const handleOnClick = () => {
    setCanvasToDisplay(canvas);
  };

  const handleCopyToClipboard = () => {
    if (canvas.items !== undefined) {
      const body = canvas.items?.[0]?.items?.[0]?.body;
      if (body !== undefined && typeof body !== 'string' && 'id' in body && body.id !== undefined) {
        void navigator.clipboard.writeText(body.id);
      }
    }
  };

  const handleCreateCollection = () => {
    openNewCollectionDialog({ selection: getSelectedCanvases(), manifestId });
  };

  const idDisplayed = canvasToDisplay?.id === canvas?.id;
  const match = canvas.id.match(/f\d+/);
  const canvasItemId = match ? match[0] : '';

  //TODO : il faut corriger le aria-label pour qu'il prenne une chaine de caractère
  return (
    <>
      {/* modal={false} : fix a bug with the Dialog+ContextMenu : https://github.com/radix-ui/primitives/issues/1836 */}
      <ContextMenu modal={false}>
        <div className='no-select flex h-full w-full justify-center' draggable={false}>
          <ContextMenuTrigger>
            <div
              className={`group flex h-fit w-fit cursor-pointer flex-col items-center rounded-md p-1 shadow transition duration-200 hover:scale-105 ${idDisplayed ? 'bg-saffron-400' : 'bg-saffron-900'} ${isSelected(index) ? 'ring-3 ring-saffron-300' : ''} selectable-item`}
              style={{ width: `${thumbWidth}px`, height: `${thumbHeight}px` }}
              onClick={handleOnClick}
              data-index={index}
              data-canvas-id={canvas.id}
              role='listitem'
            >
              {error !== null ? (
                <div className='text-sm text-red-400'>{error}</div>
              ) : (
                thumbnail !== null && (
                  <div className='w-fit flex-1'>
                    <AutoSizer disableWidth>
                      {({ height }) => (
                        <Thumbnail
                          thumbnail={thumbnail}
                          style={{ width: 'auto', height: `${height}px`, objectFit: 'contain' }}
                          aria-label='canvas thumbnail'
                          draggable={false}
                        />
                      )}
                    </AutoSizer>
                  </div>
                )
              )}
              <div className='flex w-full justify-between p-1 text-xs'>
                {canvas.label !== undefined && canvas.label !== null && (
                  <span>{getLabel(canvas)}</span>
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
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleResetSelection}>
            {t('menu_reset_selection')}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleCopyToClipboard}>
            {t('menu_copy_clipboard')}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
};

export default CanvasCard;
