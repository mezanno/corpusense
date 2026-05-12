import { Collection } from '@/data/models/Collection';
import { getCollectonLiveRepository } from '@/data/repositories/indexeddb/dbFactory';
import { Canvas } from '@iiif/presentation-3';
import { useLiveQuery } from 'dexie-react-hooks';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type CollectionInspectorContextValue = {
  collection: Collection | undefined;
  canvases: Canvas[] | undefined;
  getCanvasById: (canvasId: string) => Canvas | null;
  setCanvasToDisplay: (canvas: Canvas | null) => void;
  canvasToDisplay: Canvas | null;
  hasNextCanvas: () => boolean;
  hasPreviousCanvas: () => boolean;
  handleNext: () => void;
  handlePrevious: () => void;
};

export const CollectionInspectorContext = createContext<
  CollectionInspectorContextValue | undefined
>(undefined);

type Props = {
  children: React.ReactNode;
  collectionId: string;
};

export const CollectionInspectorProvider = ({ children, collectionId }: Props) => {
  const [canvasToDisplay, setCanvasToDisplay] = useState<Canvas | null>(null);

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

  const currentCanvasId = canvasToDisplay ? canvasToDisplay.id : -1;

  const getCanvasById = useCallback(
    (canvasId: string) => {
      return canvases?.find((canvas) => canvas.id === canvasId) || null;
    },
    [canvases],
  );

  const hasNextCanvas = useCallback(() => {
    if (!canvases) return false;
    const currentIndex = canvases.findIndex((canvas) => canvas.id === currentCanvasId);
    return currentIndex !== -1 && currentIndex < canvases.length - 1;
  }, [canvases, currentCanvasId]);

  const hasPreviousCanvas = useCallback(() => {
    if (!canvases) return false;
    const currentIndex = canvases.findIndex((canvas) => canvas.id === currentCanvasId);
    return currentIndex > 0;
  }, [canvases, currentCanvasId]);

  const getNextCanvas = useCallback(() => {
    if (!canvases) return null;
    const currentIndex = canvases.findIndex((canvas) => canvas.id === currentCanvasId);
    if (currentIndex === -1 || currentIndex === canvases.length - 1) return null;
    return canvases[currentIndex + 1];
  }, [canvases, currentCanvasId]);

  const getPreviousCanvas = useCallback(() => {
    if (!canvases) return null;
    const currentIndex = canvases.findIndex((canvas) => canvas.id === currentCanvasId);
    if (currentIndex <= 0) return null;
    return canvases[currentIndex - 1];
  }, [canvases, currentCanvasId]);

  const handleNext = () => {
    if (canvasToDisplay === null) return;
    const nextCanvas = getNextCanvas();
    if (nextCanvas) {
      setCanvasToDisplay(nextCanvas);
    }
  };

  const handlePrevious = () => {
    if (canvasToDisplay === null) return;
    const previousCanvas = getPreviousCanvas();
    if (previousCanvas) {
      setCanvasToDisplay(previousCanvas);
    }
  };

  const value = {
    collection,
    canvases,
    hasNextCanvas,
    hasPreviousCanvas,
    getCanvasById,
    setCanvasToDisplay,
    canvasToDisplay,
    handleNext,
    handlePrevious,
  };

  return (
    <CollectionInspectorContext.Provider value={value}>
      {children}
    </CollectionInspectorContext.Provider>
  );
};

export const useCollectionInspectorContext = () => {
  const context = useContext(CollectionInspectorContext);
  if (context === undefined) {
    throw new Error(
      'useCollectionInspectorContext must be used within a CollectionInspectorProvider',
    );
  }
  return context;
};
