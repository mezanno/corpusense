import { Combine, MessageSquareOff, OctagonXIcon } from 'lucide-react';

import { FC } from 'react';
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
  const params = {
    name: 'btn_dangerous_menu',
    icon: <OctagonXIcon />,
    info: 'info_dangerous_menu',
    items: [
      {
        name: 'btn_reset_annotations',
        icon: <MessageSquareOff />,
        action: handleDeleteAllAnnotations,
      },
      {
        name: 'btn_reset_regions',
        icon: <Combine />,
        action: handleRecomputeRegions,
      },
    ],
  };

  return <MultiOptionsMenu params={params} elementId={elementId} color='text-red-500' />;
};

export default DangerousMenu;
