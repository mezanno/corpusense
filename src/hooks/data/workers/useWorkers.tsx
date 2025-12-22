import { Worker } from '@/data/models/Worker';
import { getResultRepository, getWorkerRepository } from '@/data/repositories/indexeddb/dbFactory';
import { useAppDispatch } from '@/hooks/hooks';
import { pushError } from '@/state/reducers/events';
import { workerPlugins } from '@/state/sagas/workers';
import { getErrorMessage } from '@/utils/utils';

const useWorkers = () => {
  const appDispatch = useAppDispatch();
  const workerRepository = getWorkerRepository();

  const removeWorker = async (workerId: string) => {
    await workerRepository.deleteById(workerId);
  };

  const removeResult = async (workerId: string, taskId: number) => {
    await workerRepository.deleteResultById(workerId, taskId);
  };

  const exportWorkerResult = async (worker: Worker, formats: string[]) => {
    const saga = workerPlugins[worker.name];

    //get the results for the worker
    const resultRepository = getResultRepository();
    const results = await resultRepository.getAllByWorkerId(worker.id);

    try {
      if (saga !== undefined && saga !== null && saga.export) {
        if (results.length === 0) {
          //TODO! afficher message d'erreur dans l'UI
          console.warn(`No results found for worker ${worker.id}`);
          return;
        }

        saga.export(results, formats);
      }
    } catch (error) {
      console.error(`Error in export plugin saga for ${worker.name}:`, error);
      appDispatch(
        pushError(`Error in export plugin saga for ${worker.name}: ${getErrorMessage(error)}`),
      );
    }
  };

  return {
    removeWorker,
    removeResult,
    exportWorkerResult,
  };
};

export default useWorkers;
