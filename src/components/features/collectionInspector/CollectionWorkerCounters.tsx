import { useWorkerContext } from '@/components/reducers/WorkerContext';
import { WorkerStatus } from '@/data/models/worker/worker';
import { useMemo } from 'react';
import { PacmanLoader } from 'react-spinners';
import WorkerDurationCounter from './WorkerDurationCounter';

const CollectionWorkerCounters = ({ collectionId }: { collectionId: string }) => {
  const { getWorkersByScopeAndStatus } = useWorkerContext();

  const runningWorkers = useMemo(
    () =>
      getWorkersByScopeAndStatus({ collectionId }, [
        WorkerStatus.INPROGRESS,
        WorkerStatus.INPROGRESS_WITH_ERRORS,
      ]),
    [collectionId, getWorkersByScopeAndStatus],
  );

  return (
    <div className='flex w-full flex-col gap-1'>
      {runningWorkers.map((worker) => (
        <div className='flex gap-2' key={`${worker.id}-${worker.estimatedDuration}`}>
          <p className='flex flex-col items-baseline gap-1 text-sm font-semibold'>
            <span className='flex items-center gap-8'>
              <PacmanLoader size={10} />
              {worker.name}
            </span>
            <WorkerDurationCounter estimatedDuration={worker.estimatedDuration} />
          </p>
        </div>
      ))}
    </div>
  );
};

export default CollectionWorkerCounters;
