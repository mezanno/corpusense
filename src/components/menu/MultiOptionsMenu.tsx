import { Scope } from '@/data/models/Scope';
import { useAppSelector } from '@/hooks/hooks';
import { isWorkerOrTaskRunning } from '@/state/selectors/workers';
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
  scope,
  color = 'text-black',
}: {
  params: MultiOptionsMenuParams;
  scope: Scope;
  color?: string;
}) => {
  const { t } = useTranslation();
  const isRunning = useAppSelector((state) => isWorkerOrTaskRunning(state, scope));

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
                {item.name}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MultiOptionsMenu;
