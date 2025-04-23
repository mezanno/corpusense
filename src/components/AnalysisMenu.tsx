import { ScanText, TableProperties, TextSearch } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Spinner } from './ui/spinner';

const AnalysisMenu = ({
  isRunning,
  handleLayout,
  handleOcr,
}: {
  isRunning: boolean;
  handleLayout: () => void;
  handleOcr: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className='relative'>
      <DropdownMenu>
        <DropdownMenuTrigger className='soft-button' title={t('btn_start_analysis')}>
          <TextSearch />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className='flex items-center gap-2 space-x-2'>
            {isRunning ? (
              <>
                {t('info_analysis_running')}
                <Spinner size={'small'} />
              </>
            ) : (
              t('info_start_analysis')
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={isRunning} onClick={handleLayout}>
            <TableProperties />
            {t('btn_detect_layout')}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isRunning} onClick={handleOcr}>
            <ScanText />
            {t('btn_OCR_analyze')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {isRunning && <Spinner className='absolute -top-2 -right-2' size={'small'} />}
    </div>
  );
};

export default AnalysisMenu;
