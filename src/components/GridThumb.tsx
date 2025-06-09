import WorkerStatusIcon from '@/components/WorkerStatusIcon';
import { ElementType } from '@/data/models/Annotation';
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
  const canvas = useAppSelector((state) => getCanvasById(state, canvasId)) as Canvas;
  const idDisplayed = useAppSelector((state) =>
    isCanvasDisplayed(state, canvasId, canvasViewerName),
  );
  const hasLineAnnotations =
    useAppSelector((state) => getAnnotationsByType(state, canvasId, collectionId, ElementType.LINE))
      .length > 0;

  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const handleOnClick = () => {
    if (canvas !== undefined) {
      dispatch(setCanvasFromComponent({ componentId: canvasViewerName, canvas, collectionId }));
    }
  };

  const handleDelete = useCallback(() => {
    console.log('Delete', canvasId);
    dispatch(removeElementFromCollectionRequest({ collectionId: collectionId, canvasId }));
  }, [canvasId]);

  if (canvas === undefined) {
    return <div aria-errormessage='Error while loading canvas'>Error while loading canvas</div>;
  }
  const thumbnail = canvas.thumbnail as IIIFExternalWebResource[];

  return (
    <div
      className={`group relative cursor-pointer rounded-md p-1 shadow transition hover:scale-110 ${idDisplayed ? 'bg-amber-400' : 'bg-amber-100'} `}
      onClick={handleOnClick}
    >
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
