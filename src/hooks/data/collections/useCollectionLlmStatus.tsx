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
    const workers = await workerRepository.getByNamesAndScope(['openai', 'mistral'], {
      collectionId,
    });
    if (workers.length === 0) return;

    const saga = workerPlugins[workers[0].name];

    const resultRepository = getResultRepository();
    const results = await resultRepository.getAllByWorkerId(workers[0].id);

    if (saga?.extractData) {
      return await saga.extractData(results);
    }
  };

  const hasLlmResult = useLiveQuery(
    workerLiveRepository.hasResult({ collectionId }, ['openai', 'mistral']),
    [collectionId, workerLiveRepository],
    false,
  );

  return { hasLlmResult, getResultData };
};

export default useCollectionLlmStatus;
