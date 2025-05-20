import { Puzzle, ScanText, TableProperties, TextSearch } from 'lucide-react';
import MultiOptionsMenu from './MultiOptionsMenu';

const AnalysisMenu = ({
  isRunning,
  handleLayout,
  handleOcr,
  handleExtractData,
}: {
  isRunning: boolean;
  handleLayout?: () => void;
  handleOcr?: () => void;
  handleExtractData?: () => void;
}) => {
  const params = {
    name: 'btn_start_analysis',
    icon: <TextSearch />,
    info: 'info_start_analysis',
    items: [
      {
        name: 'btn_detect_layout',
        icon: <TableProperties />,
        action: handleLayout,
      },
      {
        name: 'btn_OCR_analyze',
        icon: <ScanText />,
        action: handleOcr,
      },
      {
        name: 'btn_data_extraction',
        icon: <Puzzle />,
        action: handleExtractData,
      },
    ],
  };

  return <MultiOptionsMenu params={params} isRunning={isRunning} />;
};

export default AnalysisMenu;
