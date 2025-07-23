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

const GridThumb = ({
  canvasId,
  collectionId,
  canvasViewerName,
}: {
  canvasId: string;
  collectionId: string;
  canvasViewerName: string;
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
      className={`group relative cursor-pointer rounded-md p-1 shadow transition hover:scale-110 ${idDisplayed ? 'bg-amber-400' : 'bg-amber-100'} `}
      onClick={handleOnClick}
    >
      <div className='flex w-full justify-between p-1 text-xs'>
        {canvas.label !== undefined && canvas.label !== null && <span>{canvas.label.none}</span>}
        <span className='text-gray-600 italic'>{canvasItemId}</span>
      </div>
      <Thumbnail
        thumbnail={thumbnail}
        style={{ width: '100px', height: '100px', objectFit: 'contain' }}
        className='w-fit'
        aria-label='canvas thumbnail'
      />
      <button
        className='absolute top-0 right-0 flex cursor-pointer items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110'
        title={t('btn_delete_collection')}
      >
        <CircleX className='text-red-400 hover:text-red-800' onClick={handleDelete} />
      </button>

      <div className='absolute bottom-0 left-0 rounded-xl bg-white p-1 shadow'>
        {hasLineAnnotations ? (
          <SpellCheck size={16} color='green' />
        ) : (
          <SpellCheck2 size={16} color='red' />
        )}
      </div>

      <WorkerStatusIcon scope={{ collectionId, canvasId }} />
    </div>
  );
};

export default GridThumb;
