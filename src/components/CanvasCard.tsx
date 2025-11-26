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

import { CollectionDetails } from '@/data/models/Collection';
import { getImageForThumbnail, getLabel } from '@/data/utils/canvas';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { useCanvasSelection } from '@/hooks/useCanvasSelection';
import { getObjectUrl } from '@/hooks/useFs';
import {
  addSelectionToCollectionRequest,
  createCollectionWithSelectionRequest,
} from '@/state/reducers/collections';
import { selectCollections } from '@/state/selectors/collections';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

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
  const appDispatch = useAppDispatch();
  const [dialogOpen, setDialogOpen] = useState(false);
  const collections: CollectionDetails[] = useAppSelector(selectCollections);
  const {
    isSelected,
    hasSelectedElements,
    getSelectedCanvases,
    setSelectionEnd,
    setSelectionStart,
    setSelection,
  } = useCanvasSelection();
  const [thumbnail, setThumbnail] = useState<IIIFExternalWebResource[] | null>(null);

  const inputCollectionName = useRef(null);

  useEffect(() => {
    const fetchThumbnail = async () => {
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
    if (collectionId === undefined) return;
    appDispatch(
      addSelectionToCollectionRequest({
        selection: getSelectedCanvases(),
        collectionId: collectionId,
        manifestId,
      }),
    );
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
    const input: HTMLInputElement | null = inputCollectionName.current;
    //TODO! : gérer le cas où input est null
    if (input === null) return;
    const collectionName = (input as HTMLInputElement).value;
    appDispatch(
      createCollectionWithSelectionRequest({
        selection: getSelectedCanvases(),
        name: collectionName,
        manifestId,
      }),
    );
    setDialogOpen(false);
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
              {thumbnail !== null && (
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
              <ContextMenuItem onClick={() => setDialogOpen(true)}>
                {t('menu_create_from_selection')}
              </ContextMenuItem>
              {collections?.length > 0 && (
                <ContextMenuSub>
                  <ContextMenuSubTrigger>
                    {t('menu_add_selection_to_collection')}
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    {collections.map((col) => (
                      <ContextMenuItem
                        key={col.id}
                        onClick={() => handleAddSelectionToCollection(col.id)}
                      >
                        {col.name}
                      </ContextMenuItem>
                    ))}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('btn_create_collection')}</DialogTitle>
            <DialogDescription>{t('form_description_create_collection')}</DialogDescription>
          </DialogHeader>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='name' className='text-right'>
              {t('form_label_collection_name')}
            </Label>
            <Input
              ref={inputCollectionName}
              id='name'
              placeholder={t('form_placeholder_collection_name')}
              className='col-span-3'
            />
          </div>
          <DialogFooter>
            <Button onClick={handleCreateCollection}>{t('btn_create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CanvasCard;
