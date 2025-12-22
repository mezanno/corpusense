import { Scope } from '@/data/models/Scope';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ClockLoader } from 'react-spinners';
import { useWorkerContext } from '../reducers/WorkerContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Spinner } from '../ui/spinner';

interface MultiOptionsMenuItem {
  name: string;
  description?: string;
  icon: React.ReactNode;
  action?: () => void;
  category?: string;
}

export interface MultiOptionsMenuParams {
  name: string;
  icon: React.ReactNode;
  info: string;
  items: MultiOptionsMenuItem[];
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
  const isRunning = useWorkerContext().isWorkerOrTaskRunning(scope);

  const generateDropdownMenuItems = (items: MultiOptionsMenuItem[]) => {
    return items.map((item) => (
      <DropdownMenuItem
        key={item.name}
        disabled={isRunning}
        onClick={item.action}
        title={item.description}
      >
        {item.icon}
        {item.name}
      </DropdownMenuItem>
    ));
  };

  const menus = useMemo(() => {
    const categories = Array.from(new Set(params.items.map((item) => item.category)));
    return categories.map((category) => (
      <DropdownMenuGroup key={category ?? 'uncategorized'}>
        {category !== undefined ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {t(`category_${category.toLocaleLowerCase()}`)}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {generateDropdownMenuItems(
                  params.items.filter((item) => item.category === category),
                )}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        ) : (
          generateDropdownMenuItems(params.items.filter((item) => item.category === undefined))
        )}
      </DropdownMenuGroup>
    ));
  }, [params.items, isRunning]);

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
          {menus}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MultiOptionsMenu;
