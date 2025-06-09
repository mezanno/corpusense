import { WorkerScope } from '@/data/models/Worker';
import { Copy, Layers, Layers2 } from 'lucide-react';
import MultiOptionsMenu from './MultiOptionsMenu';

const LayoutMenu = ({
  elementId,
  scope,
  handleDuplicateToAll,
  handleDuplicateEach2,
}: {
  elementId: string;
  scope: WorkerScope;
  handleDuplicateToAll?: () => void;
  handleDuplicateEach2?: () => void;
}) => {
  const params = {
    name: 'btn_duplicate_regions',
    icon: <Copy />,
    info: 'info_duplicate_menu',
    items: [
      {
        name: 'btn_duplicate_regions_all',
        icon: <Layers />,
        action: handleDuplicateToAll,
      },
      {
        name: 'btn_duplicate_regions_each2',
        icon: <Layers2 />,
        action: handleDuplicateEach2,
      },
    ],
  };

  return <MultiOptionsMenu params={params} elementId={elementId} scope={scope} />;
};

export default LayoutMenu;
