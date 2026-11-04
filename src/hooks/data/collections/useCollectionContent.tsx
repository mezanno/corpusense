import { getCollectionLiveRepository } from '@/data/repositories/indexeddb/dbFactory';
import { Canvas } from '@iiif/presentation-3';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useMemo } from 'react';

export type CanvasWithSourceId = {
  canvas: Canvas;
  sourceId: string;
};

export const useCollectionContent = (collectionId: string) => {
  const collectionRepository = useMemo(() => getCollectionLiveRepository(), []);

  const getCollectionByIdQuery = useMemo(
    () => collectionRepository.getById(collectionId),
    [collectionRepository, collectionId],
  );

  const collection = useLiveQuery(getCollectionByIdQuery, [collectionId]);

  const getCanvasesByCollectionIdQuery = useMemo(
    () => collectionRepository.getCanvasesByCollectionId(collectionId),
    [collectionRepository, collectionId],
  );

  const canvases = useLiveQuery(
    getCanvasesByCollectionIdQuery,
    [collectionId],
    [] as CanvasWithSourceId[],
  );

  const getCanvasById = useCallback(
    (canvasId: string) => {
      return canvases?.find((canvas) => canvas.canvas.id === canvasId) || null;
    },
    [canvases],
  );

  const hasNextCanvas = useCallback(
    (currentCanvasId: string) => {
      const currentIndex = canvases.findIndex((canvas) => canvas.canvas.id === currentCanvasId);
      return currentIndex !== -1 && currentIndex < canvases.length - 1;
    },
    [canvases],
  );

  const hasPreviousCanvas = useCallback(
    (currentCanvasId: string) => {
      const currentIndex = canvases.findIndex((canvas) => canvas.canvas.id === currentCanvasId);
      return currentIndex > 0;
    },
    [canvases],
  );

  const getNextCanvas = useCallback(
    (currentCanvasId: string) => {
      const currentIndex = canvases.findIndex((canvas) => canvas.canvas.id === currentCanvasId);
      if (currentIndex === -1 || currentIndex === canvases.length - 1) return null;
      return canvases[currentIndex + 1];
    },
    [canvases],
  );

  const getPreviousCanvas = useCallback(
    (currentCanvasId: string) => {
      const currentIndex = canvases.findIndex((canvas) => canvas.canvas.id === currentCanvasId);
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
