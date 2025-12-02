import { getCollectonLiveRepository } from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useMemo } from 'react';

export const useCollectionContent = (collectionId: string) => {
  const collectionRepository = useMemo(() => getCollectonLiveRepository(), []);

  const getCollectionByIdQuery = useMemo(
    () => collectionRepository.getById(collectionId),
    [collectionRepository, collectionId],
  );

  const collection = useLiveQuery(getCollectionByIdQuery, [collectionId]);

  const getCanvasesByCollectionIdQuery = useMemo(
    () => collectionRepository.getCanvasesByCollectionId(collectionId),
    [collectionRepository, collectionId],
  );

  const canvases = useLiveQuery(getCanvasesByCollectionIdQuery, [collectionId]);

  const getCanvasById = useCallback(
    (canvasId: string) => {
      return canvases?.find((canvas) => canvas.id === canvasId) || null;
    },
    [canvases],
  );

  return {
    collection,
    canvases,
    getCanvasById,
  };
};
