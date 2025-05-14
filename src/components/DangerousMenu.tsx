import { MessageSquareOff, OctagonXIcon } from 'lucide-react';

import { FC } from 'react';
import MultiOptionsMenu from './MultiOptionsMenu';

interface DangerousMenuProps {
  isRunning: boolean;
  handleDeleteAllAnnotations?: () => void;
}

const DangerousMenu: FC<DangerousMenuProps> = ({ isRunning, handleDeleteAllAnnotations }) => {
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
    ],
  };

  return <MultiOptionsMenu params={params} isRunning={isRunning} color='text-red-500' />;
};

export default DangerousMenu;
