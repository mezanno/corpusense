import { Canvas, IIIFExternalWebResource } from '@iiif/presentation-3';
import { Label, Thumbnail } from '@samvera/clover-iiif/primitives';
import { Card, CardContent, CardHeader } from './ui/card';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './ui/context-menu';

import { List } from '@/data/models/list';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { addSelectionToListRequest } from '@/state/reducers/lists';
import { getLists } from '@/state/selectors/lists';
import { setSelectionEnd, setSelectionStart } from '../state/reducers/selection';
import { getSelection, isSelected } from '../state/selectors/selection';

interface CanvasCardProps {
  index: number;
  canvas: Canvas;
  onClick: (canvas: Canvas) => void;
}

const CanvasCard = ({ index, canvas, onClick }: CanvasCardProps) => {
  const selection = useAppSelector(getSelection);
  const lists: List[] = useAppSelector(getLists);
  const selected: boolean = useAppSelector(isSelected(index, canvas.id));

  //TODO : gérer le cas où canvas.thumbnail est undefined
  const thumbnail = canvas.thumbnail as IIIFExternalWebResource[];

  const dispatch = useAppDispatch();

  //! mieux gérer le cas où canvas est undefined
  if (canvas === undefined) {
    return <div>Erreur</div>;
  }

  const handleSetSelectionStart = () => {
    dispatch(setSelectionStart({ index, canvas }));
  };

  const handleSetSelectionEnd = () => {
    dispatch(setSelectionEnd({ index, canvas }));
  };

  const handleAddSelectionToList = (listId: string | undefined) => {
    if (listId === undefined) return;
    dispatch(addSelectionToListRequest({ selection, listId }));
  };

  return (
    <ContextMenu>
      <div className='flex h-full w-full justify-center'>
        <ContextMenuTrigger>
          <Card
            onClick={() => onClick(canvas)}
            className={`selectable-item h-fit w-fit ${selected ? 'bg-blue-300' : 'bg-white'}`}
            data-index={index}
            data-canvas-id={canvas.id}
          >
            <CardHeader>
              <Label className='text-center' label={canvas.label ? canvas.label : {}} />
            </CardHeader>
            <CardContent>
              <Thumbnail
                thumbnail={thumbnail}
                style={{ width: 'auto', height: '100px' }}
                className='w-fit'
              />
            </CardContent>
          </Card>
        </ContextMenuTrigger>
      </div>

      <ContextMenuContent>
        {selection.length > 0 && (
          <ContextMenuSub>
            <ContextMenuSubTrigger> Ajouter la sélection à une liste</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {lists?.length > 0 &&
                lists.map((list: List) => (
                  <ContextMenuItem key={list.id} onClick={() => handleAddSelectionToList(list.id)}>
                    {list.name}
                  </ContextMenuItem>
                ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
        <ContextMenuItem onClick={handleSetSelectionStart}>
          Définir le début de sélection ici
        </ContextMenuItem>
        <ContextMenuItem onClick={handleSetSelectionEnd}>
          Définir la fin de sélection ici
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default CanvasCard;
