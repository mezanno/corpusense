import { Scope } from '@/data/models/Scope';
import { PocketKnife, Puzzle, ScanText, TableProperties } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MultiOptionsMenu from './MultiOptionsMenu';

const AnalysisMenu = ({
  scope,
  handleLayout,
  handleOcr,
  handleExtractData,
  handleOcrWrite,
}: {
  scope: Scope;
  handleLayout?: () => void;
  handleOcr?: () => void;
  handleExtractData?: () => void;
  handleOcrWrite?: () => void;
}) => {
  const { t } = useTranslation();
  const params = {
    name: 'btn_start_analysis',
    icon: <PocketKnife />,
    info: 'info_start_analysis',
    items: [
      {
        name: t('btn_detect_layout'),
        icon: <TableProperties />,
        action: handleLayout,
      },
      {
        name: t('btn_OCR_analyze'),
        icon: <ScanText />,
        action: handleOcr,
      },
      {
        name: t('btn_OCR_surya'),
        icon: <ScanText />,
        action: handleOcrWrite,
      },
      {
        name: t('btn_data_extraction'),
        icon: <Puzzle />,
        action: handleExtractData,
      },
    ],
  };

  return <MultiOptionsMenu params={params} scope={scope} />;
};

export default AnalysisMenu;
