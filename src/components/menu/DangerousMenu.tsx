import { Combine, MessageSquareOff, OctagonXIcon } from 'lucide-react';

import { WorkerScope } from '@/data/models/Worker';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import MultiOptionsMenu from './MultiOptionsMenu';

interface DangerousMenuProps {
  elementId: string;
  scope: WorkerScope;
  handleDeleteAllAnnotations?: () => void;
  handleRecomputeRegions?: () => void;
}

const DangerousMenu: FC<DangerousMenuProps> = ({
  elementId,
  scope,
  handleDeleteAllAnnotations,
  handleRecomputeRegions,
}) => {
  const { t } = useTranslation();
  const params = {
    name: 'btn_dangerous_menu',
    icon: <OctagonXIcon />,
    info: 'info_dangerous_menu',
    items: [
      {
        name: t('btn_reset_annotations'),
        icon: <MessageSquareOff />,
        action: handleDeleteAllAnnotations,
      },
      {
        name: t('btn_reset_regions'),
        icon: <Combine />,
        action: handleRecomputeRegions,
      },
    ],
  };

  return (
    <MultiOptionsMenu params={params} elementId={elementId} scope={scope} color='text-red-500' />
  );
};

export default DangerousMenu;
