import { Scope } from '@/data/models/Scope';
import { Copy, Layers, Layers2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MultiOptionsMenu from './MultiOptionsMenu';

const LayoutMenu = ({
  scope,
  handleDuplicateToAll,
  handleDuplicateEach2,
}: {
  scope: Scope;
  handleDuplicateToAll?: () => void;
  handleDuplicateEach2?: () => void;
}) => {
  const { t } = useTranslation();
  const params = {
    name: 'btn_duplicate_regions',
    icon: <Copy />,
    info: 'info_duplicate_menu',
    items: [
      {
        name: t('btn_duplicate_regions_all'),
        icon: <Layers />,
        action: handleDuplicateToAll,
      },
      {
        name: t('btn_duplicate_regions_each2'),
        icon: <Layers2 />,
        action: handleDuplicateEach2,
      },
    ],
  };

  return <MultiOptionsMenu params={params} scope={scope} />;
};

export default LayoutMenu;
