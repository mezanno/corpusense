import { Canvas } from '@iiif/presentation-3';
import { Label, Thumbnail } from '@samvera/clover-iiif/primitives';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardHeader } from './ui/card';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from './ui/context-menu';

import { setSelectionEnd, setSelectionStart } from '../state/reducers/selection';
import { getSelection } from '../state/selectors/selection';

interface CanvasCardProps {
  index: number;
  canvas: Canvas;
  onClick: (canvas: Canvas) => void;
}

const CanvasCard = ({ index, canvas, onClick }: CanvasCardProps) => {
  const selection = useSelector(getSelection);

  const dispatch = useDispatch();

  //! mieux gérer le cas où canvas est undefined
  if (canvas === undefined) {
    return <div>Erreur</div>;
  }

  const handleSetSelectionStart = () => {
    dispatch(setSelectionStart(index));
  };

  const handleSetSelectionEnd = () => {
    dispatch(setSelectionEnd(index));
  };

  return (
    <ContextMenu>
      <div className='flex h-full w-full justify-center'>
        <ContextMenuTrigger>
          <Card
            onClick={() => onClick(canvas)}
            className={`selectable-item h-fit w-fit ${selection.includes(index) ? 'bg-blue-300' : 'bg-white'}`}
            data-index={index}
          >
            <CardHeader>
              <Label className='text-center' label={canvas.label} />
            </CardHeader>
            <CardContent>
              <Thumbnail
                thumbnail={canvas.thumbnail}
                style={{ width: 'auto', height: '100px' }}
                className='w-fit'
              />
            </CardContent>
          </Card>
        </ContextMenuTrigger>
      </div>

      <ContextMenuContent>
        {selection.length > 0 && (
          <ContextMenuItem>Ajouter la sélection à une liste</ContextMenuItem>
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
