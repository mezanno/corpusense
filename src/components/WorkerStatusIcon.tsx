import { Scope } from '@/data/models/Scope';
import { WorkerStatus } from '@/data/models/Worker';
import { useAppSelector } from '@/hooks/hooks';
import { getStatus } from '@/state/selectors/workers';
import { ClipLoader, GridLoader } from 'react-spinners';

const WorkerStatusIcon = ({ scope }: { scope: Scope }) => {
  const worker = useAppSelector((state) => getStatus(state, scope));
  if (worker === undefined) {
    return null;
  }
  if (worker?.status == WorkerStatus.WAITING) {
    return (
      <div className='absolute inset-0 flex items-center justify-center'>
        <ClipLoader size={20} />
      </div>
    );
  }
  if (worker?.status == WorkerStatus.INPROGRESS) {
    return (
      <div className='absolute inset-0 flex items-center justify-center'>
        <GridLoader size={10} />
      </div>
    );
  }
};
export default WorkerStatusIcon;
