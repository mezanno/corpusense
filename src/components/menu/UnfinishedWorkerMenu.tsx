import { Scope } from '@/data/models/Scope';
import { Worker, WorkerStatus } from '@/data/models/Worker';
import { useAppSelector } from '@/hooks/hooks';
import { getWorkersByScopeAndStatus } from '@/state/selectors/workers';
import { Hourglass, LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MultiOptionsMenu from './MultiOptionsMenu';

const UnfinishedWorkerMenu = ({
  scope,
  handleRecoverWorker,
}: {
  scope: Scope;
  handleRecoverWorker?: (worker: Worker) => void;
}) => {
  const { t } = useTranslation();

  const workers = useAppSelector((state) =>
    getWorkersByScopeAndStatus(state, scope, WorkerStatus.INPROGRESS),
  );

  const items = workers.map((worker) => ({
    name: t('btn_recover_worker', { name: worker.name }),
    icon: <Hourglass />,
    action: handleRecoverWorker ? () => handleRecoverWorker?.(worker) : undefined,
  }));

  const params = {
    name: 'btn_recover',
    icon: <LoaderCircle />,
    info: 'info_recover_worker',
    items,
  };

  return <MultiOptionsMenu params={params} scope={scope} />;
};

export default UnfinishedWorkerMenu;
