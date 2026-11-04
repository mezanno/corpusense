import { Collection } from '@/data/models/collection/collection';
import { getCollectionLiveRepository } from '@/data/repositories/indexeddb/dbFactory';
import { CanvasWithSourceId } from '@/hooks/data/collections/useCollectionContent';
import { useLiveQuery } from 'dexie-react-hooks';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type CollectionInspectorContextValue = {
  collection: Collection | undefined;
  canvases: CanvasWithSourceId[];
  getCanvasById: (canvasId: string) => CanvasWithSourceId | null;
  setCanvasToDisplay: (canvas: CanvasWithSourceId | null) => void;
  canvasToDisplay: CanvasWithSourceId | null;
  hasNextCanvas: () => boolean;
  hasPreviousCanvas: () => boolean;
  handleNext: () => void;
  handlePrevious: () => void;
};

const CollectionInspectorContext = createContext<CollectionInspectorContextValue | undefined>(
  undefined,
);

type Props = {
  children: React.ReactNode;
  collectionId: string;
};

export const CollectionInspectorProvider = ({ children, collectionId }: Props) => {
  const [canvasToDisplay, setCanvasToDisplay] = useState<CanvasWithSourceId | null>(null);
  const currentCanvasId = canvasToDisplay ? canvasToDisplay.canvas.id : -1;

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

  const hasNextCanvas = useCallback(() => {
    const currentIndex = canvases.findIndex((canvas) => canvas.canvas.id === currentCanvasId);
    return currentIndex !== -1 && currentIndex < canvases.length - 1;
  }, [canvases, currentCanvasId]);

  const hasPreviousCanvas = useCallback(() => {
    const currentIndex = canvases.findIndex((canvas) => canvas.canvas.id === currentCanvasId);
    return currentIndex > 0;
  }, [canvases, currentCanvasId]);

  const getNextCanvas = useCallback(() => {
    const currentIndex = canvases.findIndex((canvas) => canvas.canvas.id === currentCanvasId);
    if (currentIndex === -1 || currentIndex === canvases.length - 1) return null;
    return canvases[currentIndex + 1];
  }, [canvases, currentCanvasId]);

  const getPreviousCanvas = useCallback(() => {
    const currentIndex = canvases.findIndex((canvas) => canvas.canvas.id === currentCanvasId);
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
