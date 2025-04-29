import { Canvas, IIIFExternalWebResource } from '@iiif/presentation-3';
import { Label as LabelIif, Thumbnail } from '@samvera/clover-iiif/primitives';
import { Card, CardContent, CardHeader } from './ui/card';
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

import { Collection } from '@/data/models/Collection';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import {
  addSelectionToCollectionRequest,
  createCollectionWithSelectionRequest,
} from '@/state/reducers/collections';
import { setSelectionEndRequest, setSelectionStartRequest } from '@/state/reducers/selection';
import { getCollections } from '@/state/selectors/collections';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getSelection, isSelected } from '../state/selectors/selection';
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
  onClick: (target: EventTarget, canvas: Canvas) => void;
}

const CanvasCard = ({ index, canvas, manifestId, onClick }: CanvasCardProps) => {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const selection = useAppSelector(getSelection);
  const collections: Collection[] = useAppSelector(getCollections);
  const selected: boolean = useAppSelector(isSelected(index, canvas.id));

  const inputCollectionName = useRef(null);

  //TODO : gérer le cas où canvas.thumbnail est undefined
  const thumbnail = canvas.thumbnail as IIIFExternalWebResource[];

  const dispatch = useAppDispatch();

  //! mieux gérer le cas où canvas est undefined
  if (canvas === undefined) {
    return <div aria-errormessage='Error while loading canvas'>Error while loading canvas</div>;
  }

  const handleSetSelectionStart = () => {
    dispatch(setSelectionStartRequest(index));
  };

  const handleSetSelectionEnd = () => {
    dispatch(setSelectionEndRequest(index));
  };

  const handleAddSelectionToCollection = (collectionId: string | undefined) => {
    if (collectionId === undefined) return;
    dispatch(
      addSelectionToCollectionRequest({ selection, collectionId: collectionId, manifestId }),
    );
  };

  const handleClick = (target: EventTarget) => {
    onClick(target, canvas);
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
    dispatch(createCollectionWithSelectionRequest({ selection, name: collectionName, manifestId }));
    setDialogOpen(false);
  };

  //TODO : il faut corriger le aria-label pour qu'il prenne une chaine de caractère
  return (
    <>
      {/* modal={false} : fix a bug with the Dialog+ContextMenu : https://github.com/radix-ui/primitives/issues/1836 */}
      <ContextMenu modal={false}>
        <div className='flex h-full w-full justify-center'>
          <ContextMenuTrigger>
            <Card
              onClick={(e) => handleClick(e.target)}
              className={`selectable-item h-fit w-fit ${selected ? 'bg-blue-300' : 'bg-white'}`}
              data-index={index}
              data-canvas-id={canvas.id}
              role='listitem'
            >
              <CardHeader>
                <LabelIif className='text-center' label={canvas.label ? canvas.label : {}} />
              </CardHeader>
              <CardContent>
                <Thumbnail
                  thumbnail={thumbnail}
                  style={{ width: 'auto', height: '100px', objectFit: 'contain' }}
                  className='w-fit'
                  aria-label={t('aria_label_thumbnail_canvas', {
                    canvas: canvas.label ? canvas.label : '',
                  })}
                />
              </CardContent>
            </Card>
          </ContextMenuTrigger>
        </div>

        <ContextMenuContent>
          {selection.length > 0 && (
            <>
              <ContextMenuItem onClick={() => setDialogOpen(true)}>
                {t('menu_create_from_selection')}
              </ContextMenuItem>
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  {t('menu_add_selection_to_collection')}
                </ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  {collections?.length > 0 &&
                    collections.map((col) => (
                      <ContextMenuItem
                        key={col.id}
                        onClick={() => handleAddSelectionToCollection(col.id)}
                      >
                        {col.name}
                      </ContextMenuItem>
                    ))}
                </ContextMenuSubContent>
              </ContextMenuSub>

              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem onClick={handleSetSelectionStart}>
            {t('menu_define_start')}
          </ContextMenuItem>
          <ContextMenuItem onClick={handleSetSelectionEnd}>{t('menu_define_end')}</ContextMenuItem>
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
