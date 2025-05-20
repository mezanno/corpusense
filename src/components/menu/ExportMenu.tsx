import { ScrollText, SendHorizonal } from 'lucide-react';
import MultiOptionsMenu from './MultiOptionsMenu';

const ExportMenu = ({
  elementId,
  handleExportText,
}: {
  elementId: string;
  handleExportText?: () => void;
}) => {
  const params = {
    name: 'btn_export_menu',
    icon: <SendHorizonal />,
    info: 'info_export_menu',
    items: [
      {
        name: 'btn_export_text',
        icon: <ScrollText />,
        action: handleExportText,
      },
    ],
  };
  return <MultiOptionsMenu params={params} elementId={elementId} />;
};

export default ExportMenu;
