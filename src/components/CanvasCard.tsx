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

import { List } from '@/data/models/List';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { addSelectionToListRequest, createListWithSelectionRequest } from '@/state/reducers/lists';
import { setSelectionEndRequest, setSelectionStartRequest } from '@/state/reducers/selection';
import { getLists } from '@/state/selectors/lists';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getSelection, isSelected } from '../state/selectors/selection';
import { Button } from './ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  const selection = useAppSelector(getSelection);
  const lists: List[] = useAppSelector(getLists);
  const selected: boolean = useAppSelector(isSelected(index, canvas.id));

  const inputListName = useRef(null);

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

  const handleAddSelectionToList = (listId: string | undefined) => {
    if (listId === undefined) return;
    dispatch(addSelectionToListRequest({ selection, listId, manifestId }));
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

  const handleCreateList = () => {
    const input: HTMLInputElement | null = inputListName.current;
    //TODO! : gérer le cas où input est null
    if (input === null) return;
    const listName = (input as HTMLInputElement).value;
    dispatch(createListWithSelectionRequest({ selection, name: listName, manifestId }));
  };

  return (
    <Dialog>
      <ContextMenu>
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
                />
              </CardContent>
            </Card>
          </ContextMenuTrigger>
        </div>

        <ContextMenuContent>
          {selection.length > 0 && (
            <>
              <DialogTrigger asChild>
                <ContextMenuItem>{t('menu_create_from_selection')}</ContextMenuItem>
              </DialogTrigger>
              <ContextMenuSub>
                <ContextMenuSubTrigger>{t('menu_add_selection_to_list')}</ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  {lists?.length > 0 &&
                    lists.map((list: List) => (
                      <ContextMenuItem
                        key={list.id}
                        onClick={() => handleAddSelectionToList(list.id)}
                      >
                        {list.name}
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

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('btn_create_list')}</DialogTitle>
          <DialogDescription>{t('form_description_create_list')}</DialogDescription>
        </DialogHeader>
        <div className='grid grid-cols-4 items-center gap-4'>
          <Label htmlFor='name' className='text-right'>
            {t('form_label_listname')}
          </Label>
          <Input
            ref={inputListName}
            id='name'
            placeholder={t('form_placeholder_listname')}
            className='col-span-3'
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type='button' onClick={handleCreateList}>
              {t('btn_create')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CanvasCard;
