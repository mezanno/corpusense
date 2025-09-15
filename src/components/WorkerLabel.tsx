import { Worker } from '@/data/models/Worker';
import { useTranslation } from 'react-i18next';
import ScopeLabel from './ScopeLabel';
import { getTaskStatusColor, getWorkerStatusIcon } from './workerUtils';

const WorkerLabel = ({ worker }: { worker: Worker }) => {
  const { t } = useTranslation();
  return (
    <div className={`flex items-center gap-2 p-2 ${getTaskStatusColor(worker.status)}`}>
      <span
        className={`rounded px-2 py-1 text-sm ${getTaskStatusColor(worker.status)} bg-opacity-10`}
      >
        {getWorkerStatusIcon(worker.status)}
      </span>

      <span className='break-words'>
        {worker.name} [{t(`worker_status_${worker.status}`)}] <ScopeLabel scope={worker.scope} />
      </span>
    </div>
  );
};

export default WorkerLabel;
