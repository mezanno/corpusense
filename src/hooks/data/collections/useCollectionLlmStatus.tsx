import { workerPlugins } from '@/App';
import {
  getResultRepository,
  getWorkerLiveRepository,
  getWorkerRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

const useCollectionLlmStatus = ({ collectionId }: { collectionId: string }) => {
  const workerLiveRepository = useMemo(() => getWorkerLiveRepository(), []);

  const getResultData = async () => {
    const workerRepository = getWorkerRepository();
    const worker = await workerRepository.getByNameAndScope('mistral', { collectionId });
    if (!worker) return;

    const saga = workerPlugins[worker.name];

    const resultRepository = getResultRepository();
    const results = await resultRepository.getAllByWorkerId(worker.id);

    if (saga?.extractData) {
      return await saga.extractData(results);
    }
  };

  const hasLlmResult = useLiveQuery(
    workerLiveRepository.hasResult({ collectionId }, 'mistral'),
    [collectionId, workerLiveRepository],
    false,
  );

  return { hasLlmResult, getResultData };
};

export default useCollectionLlmStatus;
