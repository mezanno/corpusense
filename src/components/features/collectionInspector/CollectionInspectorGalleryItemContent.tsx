import Loading from '@/components/common/Loading';
import WorkerStatusIcon from '@/components/features/workers/WorkerStatusIcon';
import { useWorkerContext } from '@/components/reducers/WorkerContext';
import { getLabel } from '@/data/utils/canvas';
import useOcrAnnotations from '@/hooks/data/annotations/useOcrAnnotations';
import { CanvasWithSourceId } from '@/hooks/data/collections/useCollectionContent';
import { useCollections } from '@/hooks/data/collections/useCollections';
import useConvertedFileIO from '@/hooks/data/convertedFiles/useConvertedFileIO';
import useThumbnail from '@/hooks/data/sources/useThumbnail';
import 'gridstack/dist/gridstack.min.css';
import { CircleX, SpellCheck, SpellCheck2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const CollectionInspectorGalleryItemContent = ({
  canvasWithSourceId,
  collectionId,
  collectionContentIndex,
  thumbWidth,
  thumbHeight,
  setCanvasToDisplay,
  canvasToDisplay,
  isDragging,
}: {
  canvasWithSourceId: CanvasWithSourceId;
  collectionId: string;
  collectionContentIndex: number;
  thumbWidth: number;
  thumbHeight: number;
  canvasToDisplay: CanvasWithSourceId | null;
  setCanvasToDisplay: (canvas: CanvasWithSourceId | null) => void;
  isDragging: boolean;
}) => {
  const { t } = useTranslation();
  const { isWorkerOrTaskRunning } = useWorkerContext();
  const [loadedThumbUrl, setLoadedThumbUrl] = useState<string | undefined>(undefined);
  const scope = useMemo(
    () => ({ collectionId, canvasId: canvasWithSourceId.canvas.id }),
    [collectionId, canvasWithSourceId.canvas.id],
  );
  // D3 (DECISIONS.md D-008, closee 2026-10-12) : verrou volontairement scope collection —
  // un traitement en cours verrouille toute la galerie, pas seulement le canvas traite.
  // Ne pas « corriger » en scope canvas lors du port UI de R1.
  const isWorkerRunning = isWorkerOrTaskRunning({ collectionId });
  const idDisplayed = canvasToDisplay?.canvas.id === canvasWithSourceId.canvas.id;
  const hasOcrAnnotations = useOcrAnnotations(scope).hasOcrAnnotations;
  const { removeElementFromCollection } = useCollections();
  const { requestPermission } = useConvertedFileIO();

  const { thumbnail, isLoading, error } = useThumbnail(canvasWithSourceId);
  const thumbUrl = thumbnail?.[0]?.id;

  const [deleting, setDeleting] = useState(false);

  const handleImgLoad = useCallback(() => {
    setLoadedThumbUrl(thumbUrl);
  }, [thumbUrl]);

  const handleImgError = useCallback(() => {
    setLoadedThumbUrl(undefined);
  }, []);
  const isImgLoaded = thumbUrl !== undefined && loadedThumbUrl === thumbUrl;

  if (deleting) {
    return null;
  }

  const handleDelete = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.stopPropagation();
    setDeleting(true);
    void (async () => {
      const removeResult = await removeElementFromCollection(
        collectionId,
        canvasWithSourceId.canvas.id,
      );
      if (!removeResult.ok) {
        setDeleting(false);
      } else {
        if (canvasToDisplay?.canvas.id === canvasWithSourceId.canvas.id) {
          setCanvasToDisplay(null);
        }
      }
    })();
  };

  const handleOnClick = async () => {
    if (error === null) {
      setCanvasToDisplay(canvasWithSourceId);
    } else {
      await requestPermission();
    }
  };

  const match = canvasWithSourceId.canvas.id.match(/f\d+/);
  const canvasItemId = match ? match[0] : '';

  return (
    <div
      className={`group relative flex h-fit w-fit cursor-pointer flex-col items-center rounded-md p-1 shadow transition duration-200 hover:scale-105 ${idDisplayed ? 'bg-saffron-400' : 'bg-saffron-900'} `}
      style={{
        width: `${thumbWidth}px`,
        height: `${thumbHeight}px`,
        opacity: isDragging ? 0.5 : 1,
      }}
      onClick={() => void handleOnClick()}
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
        <span>{collectionContentIndex + 1}</span>
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
      {error !== null ? (
        <div className='text-sm text-red-400'>{error}</div>
      ) : (
        <div className='relative flex h-full w-full flex-1 items-center justify-center overflow-hidden p-1'>
          {(!isImgLoaded || isLoading || thumbnail === null) && (
            <div className='absolute inset-0 z-10 flex items-center justify-center rounded-md bg-saffron-900 p-2'>
              <Loading />
            </div>
          )}
          {thumbUrl !== undefined && (
            <img
              src={thumbUrl}
              loading='lazy'
              decoding='async'
              onLoad={handleImgLoad}
              onError={handleImgError}
              className={`max-h-full max-w-full object-contain transition-opacity duration-200 ${isImgLoaded && !isLoading ? 'opacity-100' : 'opacity-0'}`}
              draggable={false}
            />
          )}
        </div>
      )}
      <div className='flex w-full justify-between p-1 text-xs'>
        {canvasWithSourceId.canvas.label !== undefined &&
          canvasWithSourceId.canvas.label !== null && (
            <span>{getLabel(canvasWithSourceId.canvas)}</span>
          )}
        <span className='text-dark-slate-gray-300 italic'>{canvasItemId}</span>
      </div>
      <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
        <WorkerStatusIcon scope={scope} />
      </div>
    </div>
  );
};

export default CollectionInspectorGalleryItemContent;
