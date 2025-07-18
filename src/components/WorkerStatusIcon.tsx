import { Scope } from '@/data/models/Scope';
import { WorkerStatus } from '@/data/models/Worker';
import { useAppSelector } from '@/hooks/hooks';
import { getStatus } from '@/state/selectors/workers';
import { ClipLoader, GridLoader } from 'react-spinners';

const WorkerStatusIcon = ({ scope }: { scope: Scope }) => {
  const status = useAppSelector((state) => getStatus(state, scope));

  if (status === undefined) {
    return null;
  }
  if (status == WorkerStatus.WAITING) {
    return (
      <div className='absolute inset-0 flex items-center justify-center'>
        <ClipLoader size={20} />
      </div>
    );
  }
  if (status == WorkerStatus.INPROGRESS || status == WorkerStatus.INPROGRESS_WITH_ERRORS) {
    return (
      <div className='absolute inset-0 flex items-center justify-center'>
        <GridLoader size={10} />
      </div>
    );
  }
};
export default WorkerStatusIcon;
