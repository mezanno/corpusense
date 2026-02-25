import { Combine, MessageSquareOff, OctagonXIcon } from 'lucide-react';

import { Scope } from '@/data/models/Scope';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import MultiOptionsMenu from './MultiOptionsMenu';

interface DangerousMenuProps {
  scope: Scope;
  handleDeleteAllAnnotations?: () => void;
  handleRecomputeRegions?: () => void;
  handleFusionOfRegions?: () => void;
}

const DangerousMenu: FC<DangerousMenuProps> = ({
  scope,
  handleDeleteAllAnnotations,
  handleRecomputeRegions,
  handleFusionOfRegions,
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
      {
        name: t('btn_fusion_regions'),
        icon: <Combine />,
        action: handleFusionOfRegions,
      },
    ],
  };

  return <MultiOptionsMenu params={params} scope={scope} color='text-red-500' />;
};

export default DangerousMenu;
