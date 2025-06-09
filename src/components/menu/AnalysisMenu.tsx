import { WorkerScope } from '@/data/models/Worker';
import { Puzzle, ScanText, TableProperties, TextSearch } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MultiOptionsMenu from './MultiOptionsMenu';

const AnalysisMenu = ({
  elementId,
  scope,
  handleLayout,
  handleOcr,
  handleExtractData,
}: {
  elementId: string;
  scope: WorkerScope;
  handleLayout?: () => void;
  handleOcr?: () => void;
  handleExtractData?: () => void;
}) => {
  const { t } = useTranslation();
  const params = {
    name: 'btn_start_analysis',
    icon: <TextSearch />,
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
        name: t('btn_data_extraction'),
        icon: <Puzzle />,
        action: handleExtractData,
      },
    ],
  };

  return <MultiOptionsMenu params={params} elementId={elementId} scope={scope} />;
};

export default AnalysisMenu;
