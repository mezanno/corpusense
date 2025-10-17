import WorkerStatusIcon from '@/components/WorkerStatusIcon';
import { getImageForThumbnail } from '@/data/utils/canvas';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { removeElementFromCollectionRequest } from '@/state/reducers/collections';
import {
  selectCanvasHasOcrAnnotations,
  selectLoadedCanvasById,
} from '@/state/selectors/collections';
import { Canvas, IIIFExternalWebResource } from '@iiif/presentation-3';
import { Thumbnail } from '@samvera/clover-iiif/primitives';
import 'gridstack/dist/gridstack.min.css';
import { CircleX, SpellCheck, SpellCheck2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';

const GridThumb = ({
  canvasId,
  collectionId,
  thumbWidth,
  thumbHeight,
  setCanvasToDisplay,
  canvasToDisplay,
}: {
  canvasId: string;
  collectionId: string;
  thumbWidth: number;
  thumbHeight: number;
  canvasToDisplay: Canvas | null;
  setCanvasToDisplay: (canvas: Canvas) => void;
}) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const canvas = useAppSelector((state) => selectLoadedCanvasById(state, canvasId));
  const idDisplayed = canvasToDisplay?.id === canvas?.id;
  const hasLineAnnotations = useAppSelector((state) =>
    selectCanvasHasOcrAnnotations(state, canvasId),
  );

  const handleDelete = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.stopPropagation();
    dispatch(removeElementFromCollectionRequest({ collectionId: collectionId, canvasId }));
  };

  //! mieux gérer le cas où canvas est undefined
  if (canvas === null) {
    return <div aria-errormessage='Error while loading canvas'>Error while loading canvas</div>;
  }

  const handleOnClick = () => {
    if (canvas !== null) {
      setCanvasToDisplay(canvas);
    }
  };

  const match = canvas.id.match(/f\d+/);
  const canvasItemId = match ? match[0] : '';

  const thumbnail = (canvas.thumbnail as IIIFExternalWebResource[]) ?? [
    getImageForThumbnail(canvas, 300),
  ];

  return (
    <div
      className={`group flex h-fit w-fit cursor-pointer flex-col items-center rounded-md p-1 shadow transition duration-200 hover:scale-105 ${idDisplayed ? 'bg-saffron-400' : 'bg-saffron-900'} `}
      style={{ width: `${thumbWidth}px`, height: `${thumbHeight}px` }}
      onClick={handleOnClick}
      role='listitem'
    >
      <div className='flex w-full justify-between text-xs'>
        <div className='w-fit rounded-xl bg-white p-1 shadow'>
          {hasLineAnnotations ? (
            <SpellCheck size={16} color='green' />
          ) : (
            <SpellCheck2 size={16} color='red' />
          )}
        </div>
        <button
          className='cursor-pointer opacity-0 group-hover:opacity-100 hover:scale-110'
          title={t('btn_delete_collection')}
          onClick={(e) => handleDelete(e)}
        >
          <CircleX className='text-red-400 hover:text-red-800' />
        </button>
      </div>
      <div className='w-fit flex-1'>
        <AutoSizer disableWidth>
          {({ height }) => (
            <Thumbnail
              thumbnail={thumbnail}
              style={{ width: 'auto', height: `${height}px`, objectFit: 'contain' }}
              aria-label='canvas thumbnail'
            />
          )}
        </AutoSizer>
      </div>
      <div className='flex w-full justify-between p-1 text-xs'>
        {canvas.label !== undefined && canvas.label !== null && <span>{canvas.label.none}</span>}
        <span className='text-dark-slate-gray-300 italic'>{canvasItemId}</span>
      </div>
      <WorkerStatusIcon scope={{ collectionId, canvasId }} />
    </div>
  );
};

export default GridThumb;
