import { Combine, MessageSquareOff, OctagonXIcon } from 'lucide-react';

import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import MultiOptionsMenu from './MultiOptionsMenu';

interface DangerousMenuProps {
  elementId: string;
  handleDeleteAllAnnotations?: () => void;
  handleRecomputeRegions?: () => void;
}

const DangerousMenu: FC<DangerousMenuProps> = ({
  elementId,
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

  return <MultiOptionsMenu params={params} elementId={elementId} color='text-red-500' />;
};

export default DangerousMenu;
