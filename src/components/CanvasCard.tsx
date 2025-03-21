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
  onClick: (target: EventTarget, canvas: Canvas) => void;
}

const CanvasCard = ({ index, canvas, onClick }: CanvasCardProps) => {
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
    dispatch(addSelectionToListRequest({ selection, listId }));
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
    const listName: string = inputListName?.current?.value;
    dispatch(createListWithSelectionRequest({ selection, name: listName }));
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
                <ContextMenuItem>Créer une liste à partir de la sélection</ContextMenuItem>
              </DialogTrigger>
              <ContextMenuSub>
                <ContextMenuSubTrigger> Ajouter la sélection à une liste</ContextMenuSubTrigger>
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
            Définir le début de sélection ici
          </ContextMenuItem>
          <ContextMenuItem onClick={handleSetSelectionEnd}>
            Définir la fin de sélection ici
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleCopyToClipboard}>
            Copier l&apos;URL de la ressource dans le presse-papier
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une nouvelle liste</DialogTitle>
          <DialogDescription>
            Créez une nouvelle liste à partir de la sélection que vous avez effectuée.
          </DialogDescription>
        </DialogHeader>
        <div className='grid grid-cols-4 items-center gap-4'>
          <Label htmlFor='name' className='text-right'>
            Nom de la liste
          </Label>
          <Input
            ref={inputListName}
            id='name'
            placeholder='Une liste pas comme les autres'
            className='col-span-3'
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type='button' onClick={handleCreateList}>
              Créer la liste
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CanvasCard;
