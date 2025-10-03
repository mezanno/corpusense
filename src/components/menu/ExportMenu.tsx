import { Scope } from '@/data/models/Scope';
import { Download } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import MultiOptionsMenu from './MultiOptionsMenu';

const ExportMenu = memo(function ExportMenu({
  scope,
  handleExportText,
  // handleExportResult,
}: {
  scope: Scope;
  handleExportText?: () => void;
  // handleExportResult?: (worker: Worker) => void;
}) {
  const { t } = useTranslation();

  // const workers = useAppSelector((state) =>
  //   selectWorkersByScopeAndStatus(state, scope, [
  //     WorkerStatus.COMPLETED,
  //     WorkerStatus.COMPLETED_WITH_ERRORS,
  //   ]),
  // );
  // const items = workers.map((worker) => ({
  //   name: t('btn_export_result', { name: worker.name }),
  //   icon: <Download />,
  //   action: handleExportResult ? () => handleExportResult?.(worker) : undefined,
  // }));
  // items.push({
  //   name: t('btn_export_text'),
  //   icon: <Download />,
  //   action: handleExportText ? () => handleExportText?.() : undefined,
  // });

  const items = [
    {
      name: t('btn_export_text'),
      icon: <Download />,
      action: handleExportText ? () => handleExportText?.() : undefined,
    },
  ];

  const params = {
    name: 'btn_export_menu',
    icon: <Download />,
    info: 'info_export_menu',
    items,
  };
  return <MultiOptionsMenu params={params} scope={scope} />;
});

export default ExportMenu;
