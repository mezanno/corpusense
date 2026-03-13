import { Scope } from '@/data/models/Scope';
import { Worker } from '@/data/models/Worker';
import useDialog from '@/hooks/ui/useDialog';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWorkerContext } from './reducers/WorkerContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

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
    <div className='soft-button mr-2'>
      <DropdownMenu>
        <DropdownMenuTrigger className='flex gap-2'>
          <Download />
          {t('info_results_available')}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {workersWithResults
            .filter((w) => hasResult(w.id))
            .map((w) => (
              <DropdownMenuItem key={w.id} onClick={() => handleExportResult(w)}>
                <span className='font-bold'>{w.name}</span> -{' '}
                {new Date(w.createdAt).toLocaleString()}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ResultsAvailable;
