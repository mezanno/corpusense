import { Worker, WorkerScope, WorkerStatus } from '@/data/models/Worker';
import { useAppSelector } from '@/hooks/hooks';
import { getWorkersByStatus } from '@/state/selectors/workers';
import { Download, SendHorizonal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MultiOptionsMenu from './MultiOptionsMenu';

const ExportMenu = ({
  elementId,
  scope,
  handleExportText,
  handleExportResult,
}: {
  elementId: string;
  scope: WorkerScope;
  handleExportText?: () => void;
  handleExportResult?: (worker: Worker) => void;
}) => {
  const { t } = useTranslation();

  const workers = useAppSelector((state) =>
    getWorkersByStatus(state, scope, WorkerStatus.COMPLETED),
  );
  console.log('ExportMenu workers:', workers);
  const items = workers.map((worker) => ({
    name: t('btn_export_result', { name: worker.name }),
    icon: <Download />,
    action: handleExportResult ? () => handleExportResult?.(worker) : undefined,
  }));
  items.push({
    name: t('btn_export_text'),
    icon: <SendHorizonal />,
    action: handleExportText ? () => handleExportText?.() : undefined,
  });

  const params = {
    name: 'btn_export_menu',
    icon: <SendHorizonal />,
    info: 'info_export_menu',
    items,
  };
  return <MultiOptionsMenu params={params} elementId={elementId} scope={scope} />;
};

export default ExportMenu;
