import { useAppSelector } from '@/hooks/hooks';
import { WorkerStatus } from '@/state/reducers/workers';
import { getWorker } from '@/state/selectors/workers';
import { ClipLoader, GridLoader } from 'react-spinners';

const WorkerStatusIcon = ({ elementId }: { elementId: string }) => {
  const worker = useAppSelector((state) => getWorker(state, elementId));
  if (worker === undefined) {
    return null;
  }
  if (worker?.status == WorkerStatus.PENDING) {
    return (
      <div className='absolute inset-0 flex items-center justify-center'>
        <ClipLoader size={20} />
      </div>
    );
  }
  if (worker?.status == WorkerStatus.PROCESSING) {
    return (
      <div className='absolute inset-0 flex items-center justify-center'>
        <GridLoader size={10} />
      </div>
    );
  }
};
export default WorkerStatusIcon;
