import { useWorkerContext } from '@/components/reducers/WorkerContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Scope } from '@/data/models/scope/scope';
import { Worker } from '@/data/models/worker/worker';
import useDialog from '@/hooks/ui/useDialog';
import { FileDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ResultsAvailable = ({ scope, showTitle }: { scope: Scope; showTitle?: boolean }) => {
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
    <div
      className='soft-button'
      title={t('info_results_available')}
      aria-label={t('info_results_available')}
    >
      <DropdownMenu>
        <DropdownMenuTrigger className='flex items-center gap-2'>
          <FileDown />
          {(showTitle === undefined || showTitle === true) && (
            <span className='text-sm'>{t('info_results_available')}</span>
          )}
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
