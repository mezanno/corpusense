import { useAppSelector } from '@/hooks/hooks';
import { WorkerStatus } from '@/state/reducers/workers';
import { getWorker } from '@/state/selectors/workers';
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
  elementId,
  color = 'text-black',
}: {
  params: MultiOptionsMenuParams;
  elementId: string; // used to identify the worker associated with the menu
  color?: string;
}) => {
  const { t } = useTranslation();
  const worker = useAppSelector((state) => getWorker(state, elementId));
  const isRunning =
    worker?.status === WorkerStatus.PENDING || worker?.status === WorkerStatus.PROCESSING;

  //if no action is provided, the menu will not be shown
  if (params.items.every((item) => item.action === undefined)) {
    return null;
  }

  return (
    <div className={`relative ${color}`}>
      {/* modal={false} : fix a bug with the Dialog+ContextMenu : https://github.com/radix-ui/primitives/issues/1836 */}
      <DropdownMenu modal={false}>
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
