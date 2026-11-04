import { getCollectionRepository } from '@/data/repositories/indexeddb/dbFactory';
import { useCallback, useMemo } from 'react';

const useCollectionActions = (collectionId: string) => {
  const collectionRepository = useMemo(() => getCollectionRepository(), []);

  const swapCollectionElements = useCallback(
    async (sourcePosition: number, targetPosition: number) => {
      return await collectionRepository.shiftCollectionElements(
        collectionId,
        sourcePosition,
        targetPosition,
      );
    },
    [collectionRepository, collectionId],
  );

  return {
    swapCollectionElements,
  };
};

export default useCollectionActions;
