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

  const hasNextCanvas = useCallback(
    (currentCanvasId: string) => {
      if (!canvases) return false;
      const currentIndex = canvases.findIndex((canvas) => canvas.id === currentCanvasId);
      return currentIndex !== -1 && currentIndex < canvases.length - 1;
    },
    [canvases],
  );

  const hasPreviousCanvas = useCallback(
    (currentCanvasId: string) => {
      if (!canvases) return false;
      const currentIndex = canvases.findIndex((canvas) => canvas.id === currentCanvasId);
      return currentIndex > 0;
    },
    [canvases],
  );

  const getNextCanvas = useCallback(
    (currentCanvasId: string) => {
      if (!canvases) return null;
      const currentIndex = canvases.findIndex((canvas) => canvas.id === currentCanvasId);
      if (currentIndex === -1 || currentIndex === canvases.length - 1) return null;
      return canvases[currentIndex + 1];
    },
    [canvases],
  );

  const getPreviousCanvas = useCallback(
    (currentCanvasId: string) => {
      if (!canvases) return null;
      const currentIndex = canvases.findIndex((canvas) => canvas.id === currentCanvasId);
      if (currentIndex <= 0) return null;
      return canvases[currentIndex - 1];
    },
    [canvases],
  );

  return {
    collection,
    canvases,
    hasNextCanvas,
    hasPreviousCanvas,
    getCanvasById,
    getNextCanvas,
    getPreviousCanvas,
  };
};
