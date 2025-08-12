import WorkerStatusIcon from '@/components/WorkerStatusIcon';
import { ElementType } from '@/data/models/Annotation';
import { getImageForThumbnail } from '@/data/utils/canvas';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { setCanvasFromComponent } from '@/state/reducers/canvas';
import { removeElementFromCollectionRequest } from '@/state/reducers/collections';
import { getAnnotationsByType } from '@/state/selectors/annotations';
import { isCanvasDisplayed } from '@/state/selectors/canvas';
import { getCanvasById } from '@/state/selectors/storedItems';
import { Canvas, IIIFExternalWebResource } from '@iiif/presentation-3';
import { Thumbnail } from '@samvera/clover-iiif/primitives';
import 'gridstack/dist/gridstack.min.css';
import { CircleX, SpellCheck, SpellCheck2 } from 'lucide-react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';

const GridThumb = ({
  canvasId,
  collectionId,
  canvasViewerName,
  thumbWidth,
  thumbHeight,
}: {
  canvasId: string;
  collectionId: string;
  canvasViewerName: string;
  thumbWidth: number;
  thumbHeight: number;
}) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const canvas = useAppSelector((state) => getCanvasById(state, canvasId)) as Canvas;
  const idDisplayed = useAppSelector((state) =>
    isCanvasDisplayed(state, canvasId, canvasViewerName),
  );
  const hasLineAnnotations =
    useAppSelector((state) => getAnnotationsByType(state, canvasId, collectionId, ElementType.LINE))
      .length > 0;

  const handleDelete = useCallback(() => {
    console.log('Delete', canvasId);
    dispatch(removeElementFromCollectionRequest({ collectionId: collectionId, canvasId }));
  }, [canvasId]);

  //! mieux gérer le cas où canvas est undefined
  if (canvas === undefined) {
    return <div aria-errormessage='Error while loading canvas'>Error while loading canvas</div>;
  }

  const handleOnClick = () => {
    if (canvas !== undefined) {
      dispatch(setCanvasFromComponent({ componentId: canvasViewerName, canvas, collectionId }));
    }
  };

  const match = canvas.id.match(/f\d+/);
  const canvasItemId = match ? match[0] : '';

  const thumbnail = (canvas.thumbnail as IIIFExternalWebResource[]) ?? [
    getImageForThumbnail(canvas, 300),
  ];

  return (
    <div
      className={`group flex h-fit w-fit cursor-pointer flex-col items-center rounded-md p-1 shadow transition hover:scale-110 ${idDisplayed ? 'bg-amber-400' : 'bg-amber-100'} `}
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
        >
          <CircleX className='text-red-400 hover:text-red-800' onClick={handleDelete} />
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
        <span className='text-gray-600 italic'>{canvasItemId}</span>
      </div>
      <WorkerStatusIcon scope={{ collectionId, canvasId }} />
    </div>
  );
};

export default GridThumb;
