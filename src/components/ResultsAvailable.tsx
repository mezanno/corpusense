import { Scope } from '@/data/models/Scope';
import { Worker } from '@/data/models/Worker';
import useDialog from '@/hooks/ui/useDialog';
import { useTranslation } from 'react-i18next';
import { useWorkerContext } from './reducers/WorkerContext';
import { Select, SelectContent, SelectItem, SelectTrigger } from './ui/select';

const ResultsAvailable = ({ scope }: { scope: Scope }) => {
  const { t } = useTranslation();
  const { openSelectFormatDialog } = useDialog();
  const { getWorkersByScope, hasResult } = useWorkerContext();

  const workersWithResults = getWorkersByScope(scope);
  const hasAnyResult = workersWithResults.some((w) => hasResult(w.id));

  if (!hasAnyResult) {
    return null;
  }

  const handleExportResult = (worker: Worker) => {
    openSelectFormatDialog(worker);
  };

  return (
    <div className='h-fit w-fit rounded bg-white'>
      <Select
        onValueChange={(value) => {
          const worker = workersWithResults.find((w) => w.id === value);
          if (worker) {
            handleExportResult(worker);
          }
        }}
      >
        <SelectTrigger>{t('info_results_available')}</SelectTrigger>
        <SelectContent>
          {workersWithResults
            .filter((w) => hasResult(w.id))
            .map((w) => (
              <SelectItem key={w.id} value={w.id}>
                <span className='font-bold'>{w.name}</span> -{' '}
                {new Date(w.createdAt).toLocaleString()}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ResultsAvailable;
