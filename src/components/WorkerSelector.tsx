import { WorkerStatus } from '@/data/models/Worker';
import { useAppSelector } from '@/hooks/hooks';
import { getWorkersByStatus } from '@/state/selectors/workers';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import WorkerLabel from './WorkerLabel';

const WorkerSelector = ({
  selectedWorkerId,
  setSelectedWorkerId,
}: {
  selectedWorkerId: string;
  setSelectedWorkerId: (id: string) => void;
}) => {
  const { t } = useTranslation();
  const workers = useAppSelector((state) =>
    getWorkersByStatus(state, [
      WorkerStatus.INPROGRESS,
      WorkerStatus.INPROGRESS_WITH_ERRORS,
      WorkerStatus.UNFINISHED,
      WorkerStatus.UNFINISHED_WITH_ERRORS,
    ]),
  );

  if (workers.length === 0) {
    return <div>{t('info_no_worker_running')}</div>;
  }

  return (
    <div>
      <Select onValueChange={(value) => setSelectedWorkerId(value)} value={selectedWorkerId}>
        <SelectTrigger className='w-[500px]'>
          <SelectValue placeholder={t('btn_select_worker')} />
        </SelectTrigger>
        <SelectContent>
          {workers.map((worker) => (
            <SelectItem key={worker.id} value={worker.id}>
              <WorkerLabel worker={worker} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default WorkerSelector;
