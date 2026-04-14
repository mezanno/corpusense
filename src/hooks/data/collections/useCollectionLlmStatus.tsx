import { getWorkerLiveRepository } from '@/data/repositories/indexeddb/dbFactory';
import { computeScopeKey } from '@/data/repositories/indexeddb/utils';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

const useCollectionLlmStatus = ({ collectionId }: { collectionId: string }) => {
  const workerLiveRepository = useMemo(() => getWorkerLiveRepository(), []);

  console.log(computeScopeKey({ collectionId }));

  const hasLlmResult = useLiveQuery(
    workerLiveRepository.hasResult({ collectionId }, 'mistral'),
    [collectionId, workerLiveRepository],
    false,
  );

  return hasLlmResult;
};

export default useCollectionLlmStatus;
