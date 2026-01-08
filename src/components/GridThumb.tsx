import WorkerStatusIcon from '@/components/WorkerStatusIcon';
import { getImageForThumbnail, getLabel, getObjectUrl } from '@/data/utils/canvas';
import useOcrAnnotations from '@/hooks/data/annotations/useOcrAnnotations';
import { useCollectionContent } from '@/hooks/data/collections/useCollectionContent';
import { useCollections } from '@/hooks/data/collections/useCollections';
import { Canvas, IIIFExternalWebResource } from '@iiif/presentation-3';
import { Thumbnail } from '@samvera/clover-iiif/primitives';
import 'gridstack/dist/gridstack.min.css';
import { CircleX, SpellCheck, SpellCheck2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useWorkerContext } from './reducers/WorkerContext';

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
  setCanvasToDisplay: (canvas: Canvas | null) => void;
}) => {
  const { t } = useTranslation();
  const scope = useMemo(() => ({ collectionId, canvasId }), [collectionId, canvasId]);
  const canvas = useCollectionContent(collectionId).getCanvasById(canvasId);
  const isWorkerRunning = useWorkerContext().isWorkerOrTaskRunning(scope);
  const idDisplayed = canvasToDisplay?.id === canvas?.id;
  const hasOcrAnnotations = useOcrAnnotations(scope).hasOcrAnnotations;
  const { removeElementFromCollection } = useCollections();
  const [thumbnail, setThumbnail] = useState<IIIFExternalWebResource[] | null>(null);

  //TODO! 2 fois le même code que dans CanvasCard, à factoriser
  useEffect(() => {
    const fetchThumbnail = async () => {
      const originalThumb = (canvas!.thumbnail as IIIFExternalWebResource[]) ?? [
        getImageForThumbnail(canvas!, 200),
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

    if (canvas !== null) {
      void fetchThumbnail();
    }
  }, [canvas]);

  const handleDelete = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.stopPropagation();
    void (async () => {
      await removeElementFromCollection(collectionId, canvasId);
      if (canvasToDisplay?.id === canvasId) {
        setCanvasToDisplay(null);
      }
    })();
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

  // const thumbnail = (canvas.thumbnail as IIIFExternalWebResource[]) ?? [
  //   getImageForThumbnail(canvas, 300),
  // ];

  return (
    <div
      className={`group flex h-fit w-fit cursor-pointer flex-col items-center rounded-md p-1 shadow transition duration-200 hover:scale-105 ${idDisplayed ? 'bg-saffron-400' : 'bg-saffron-900'} `}
      style={{ width: `${thumbWidth}px`, height: `${thumbHeight}px` }}
      onClick={handleOnClick}
      role='listitem'
    >
      <div className='flex w-full justify-between text-xs'>
        <div className='w-fit rounded-xl bg-white p-1 shadow'>
          {hasOcrAnnotations ? (
            <SpellCheck size={16} color='green' />
          ) : (
            <SpellCheck2 size={16} color='red' />
          )}
        </div>
        {!isWorkerRunning && (
          <button
            className='cursor-pointer opacity-0 group-hover:opacity-100 hover:scale-110'
            title={t('btn_delete_collection')}
            onClick={handleDelete}
          >
            <CircleX className='text-red-400 hover:text-red-800' />
          </button>
        )}
      </div>
      {thumbnail !== null && (
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
      )}
      <div className='flex w-full justify-between p-1 text-xs'>
        {canvas.label !== undefined && canvas.label !== null && <span>{getLabel(canvas)}</span>}
        <span className='text-dark-slate-gray-300 italic'>{canvasItemId}</span>
      </div>
      <WorkerStatusIcon scope={{ collectionId, canvasId }} />
    </div>
  );
};

export default GridThumb;
