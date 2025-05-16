import { useTranslation } from 'react-i18next';
import { ClockLoader } from 'react-spinners';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Spinner } from '../ui/spinner';

export interface MultiOptionsMenuParams {
  name: string;
  icon: React.ReactNode;
  info: string;
  items: {
    name: string;
    icon: React.ReactNode;
    action?: () => void;
  }[];
}

const MultiOptionsMenu = ({
  params,
  isRunning,
  color = 'text-black',
}: {
  params: MultiOptionsMenuParams;
  isRunning: boolean;
  color?: string;
}) => {
  const { t } = useTranslation();

  //if no action is provided, the menu will not be shown
  if (params.items.every((item) => item.action === undefined)) {
    return null;
  }

  return (
    <div className={`relative ${color}`}>
      <DropdownMenu>
        <DropdownMenuTrigger className='soft-button' title={t(params.name)}>
          {isRunning ? <ClockLoader size={24} /> : params.icon}
        </DropdownMenuTrigger>
        <DropdownMenuContent className={` ${color}`}>
          <DropdownMenuLabel className='flex items-center gap-2 space-x-2'>
            {isRunning ? (
              <>
                {t('info_analysis_running')}
                <Spinner size={'small'} />
              </>
            ) : (
              t(params.info)
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {params.items
            .filter((p) => p.action !== undefined)
            .map((item, index) => (
              <DropdownMenuItem key={index} disabled={isRunning} onClick={item.action}>
                {item.icon}
                {t(item.name)}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {/* {isRunning && <Spinner className='absolute -top-2 -right-2' size={'small'} />} */}
    </div>
  );
};

export default MultiOptionsMenu;
