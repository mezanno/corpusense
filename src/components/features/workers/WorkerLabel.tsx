import ScopeLabel from '@/components/common/ScopeLabel';
import { Worker } from '@/data/models/worker/worker';
import { useTranslation } from 'react-i18next';
import { workerStatusPresentation } from './statusPresentation';

const WorkerLabel = ({ worker }: { worker: Worker }) => {
  const { t } = useTranslation();
  return (
    <div className={`flex items-center gap-2 p-2 ${workerStatusPresentation[worker.status].color}`}>
      <span
        className={`rounded px-2 py-1 text-sm ${workerStatusPresentation[worker.status].color} bg-opacity-10`}
      >
        {workerStatusPresentation[worker.status].icon}
      </span>

      <span className='wrap-break-words'>
        {worker.name} [{t(`worker_status_${worker.status}`)}] <ScopeLabel scope={worker.scope} />
      </span>
    </div>
  );
};

export default WorkerLabel;
