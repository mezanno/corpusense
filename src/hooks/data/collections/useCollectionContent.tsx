import { getCollectonLiveRepository } from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

export const useCollectionContent = (collectionId: string) => {
  const collectionRepository = useMemo(() => getCollectonLiveRepository(), []);

  const collection = useLiveQuery(collectionRepository.getById(collectionId), [collectionId]);

  return {
    collection,
  };
};
