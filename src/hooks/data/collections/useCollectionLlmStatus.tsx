import { getWorkerLiveRepository } from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

const useCollectionLlmStatus = ({ collectionId }: { collectionId: string }) => {
  const workerLiveRepository = useMemo(() => getWorkerLiveRepository(), []);

  const hasLlmResult = useLiveQuery(
    workerLiveRepository.hasResult({ collectionId }, 'mistral'),
    [collectionId, workerLiveRepository],
    false,
  );

  return hasLlmResult;
};

export default useCollectionLlmStatus;
