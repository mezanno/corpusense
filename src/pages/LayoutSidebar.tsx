import AlertDialogLogin from '@/components/auth/AlertDialogLogin';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import WorkerLabel from '@/components/WorkerLabel';
import { WorkerStatus } from '@/data/models/Worker';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import useAppNavigation, { CorpusenseRoutes } from '@/hooks/useAppNavigation';
import { logoutRequest } from '@/state/reducers/auth';
import { removeFromOpenedCollections } from '@/state/reducers/collections';
import { connectedUser } from '@/state/selectors/auth';
import { getCollections, getOpenedCollections } from '@/state/selectors/collections';
import { getWorkersByStatus } from '@/state/selectors/workers';
import {
  Archive,
  Bolt,
  ChevronDown,
  Container,
  CornerDownRight,
  Database,
  Ellipsis,
  FolderSearch2,
  List,
  MoreHorizontal,
  ScrollText,
  User2,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '../components/ui/sidebar';

type Filter = {
  status: WorkerStatus;
  selected: boolean;
};

const WorkersSideBarGroup = ({
  setSelectedWorkerId,
}: {
  setSelectedWorkerId: (id: string) => void;
}) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<Filter[]>(
    Object.values(WorkerStatus).map((status) => ({
      status,
      selected: true,
    })),
  );

  const workers = useAppSelector((state) =>
    getWorkersByStatus(
      state,
      filters.filter((f) => f.selected).map((f) => f.status),
    ),
  );

  return (
    <SidebarGroup className='h-1/2 overflow-y-auto'>
      <SidebarGroupLabel>
        {t('nav_workers')}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarGroupAction>
              <div>
                <Ellipsis className='rounded-lg border border-yellow-400' />
              </div>
            </SidebarGroupAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent side='right' align='start'>
            {filters.map((filter) => (
              <DropdownMenuItem
                key={filter.status}
                onClick={() =>
                  setFilters((prev) =>
                    prev.map((f) =>
                      f.status === filter.status ? { ...f, selected: !f.selected } : f,
                    ),
                  )
                }
              >
                <input
                  type='checkbox'
                  checked={filter.selected}
                  readOnly
                  className='mr-2 h-4 w-4 cursor-pointer'
                />
                {t(`worker_status_${filter.status}`)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu>
          {workers.map((worker) => (
            <SidebarMenuItem
              key={worker.id}
              className='cursor-pointer overflow-hidden'
              onClick={() => setSelectedWorkerId(worker.id)}
            >
              <SidebarMenuButton asChild>
                <WorkerLabel worker={worker} />
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

const CollectionsSideBarGroup = () => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const navigation = useAppNavigation();
  const openedCollections = useAppSelector(getOpenedCollections);

  if (openedCollections.length === 0) {
    return null; // No collections opened, nothing to display
  }

  const handleOnClose = async (collectionId: string) => {
    await navigation.goToManifestExplorer();
    appDispatch(removeFromOpenedCollections(collectionId));
  };

  return (
    <SidebarGroup id='collections'>
      <SidebarMenu>
        <Collapsible defaultOpen className='group'>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton>
                <ScrollText />
                {t('nav_collections')}
                <ChevronDown className='transition-transform duration-200 group-data-[state=closed]:-rotate-90' />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {openedCollections.map(
                  (col) =>
                    col.id !== undefined && (
                      <SidebarMenuSubItem key={col.id}>
                        <SidebarMenuSubButton className='h-auto' asChild>
                          <div>
                            <CornerDownRight />
                            <Link
                              to={`/${CorpusenseRoutes.COLLECTIONS}/${col.id}`}
                              className='h-full w-full'
                              title={col.name}
                            >
                              {col.name}
                            </Link>
                          </div>
                        </SidebarMenuSubButton>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuAction title={t('btn_more_actions')}>
                              <MoreHorizontal />
                            </SidebarMenuAction>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side='right' align='start'>
                            <DropdownMenuItem onClick={() => void handleOnClose(col.id)}>
                              {t('btn_close_collection')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuSubItem>
                    ),
                )}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
};

const SourcesSideBarGroup = () => {
  const { t } = useTranslation();

  return (
    <SidebarGroup id='collections'>
      <SidebarMenu>
        <Collapsible defaultOpen className='group'>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton>
                <Database />
                {t('nav_sources')}
                <ChevronDown className='transition-transform duration-200 group-data-[state=closed]:-rotate-90' />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {[
                  {
                    title: t('page_title_manifexplorer'),
                    url: CorpusenseRoutes.MANIFEST,
                    icon: FolderSearch2,
                  },
                  {
                    title: t('page_title_storage'),
                    url: CorpusenseRoutes.STORAGE,
                    icon: Archive,
                  },
                ].map((item) => (
                  <SidebarMenuSubItem key={item.title}>
                    <SidebarMenuSubButton className='h-auto' asChild>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
};

const LayoutSideBar = ({ setSelectedWorkerId }: { setSelectedWorkerId: (id: string) => void }) => {
  const { t } = useTranslation();
  const user = useAppSelector(connectedUser);
  const appDispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const collections = useAppSelector(getCollections);

  const handleLogout = () => {
    appDispatch(logoutRequest());
  };

  return (
    <>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                {/* modal={false} : fix a bug with the Dialog+ContextMenu : https://github.com/radix-ui/primitives/issues/1836 */}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton>
                      <div className='flex items-center gap-2'>
                        <User2 />
                        {user ? user.email : t('info_not_connected')}
                        <ChevronDown className='ml-auto' />
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side='right'>
                    {user ? (
                      <DropdownMenuItem onClick={() => handleLogout()}>
                        Se déconnecter
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => setIsOpen(true)}>
                        Se connecter
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SourcesSideBarGroup />
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to={CorpusenseRoutes.COLLECTIONS}>
                    <List />
                    <span>{t('page_title_collection_manager')}</span>
                    <Badge>{collections.length}</Badge>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to={CorpusenseRoutes.MODELS}>
                    <Container />
                    <span>{t('page_title_models_manager')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <CollectionsSideBarGroup />
          <WorkersSideBarGroup setSelectedWorkerId={setSelectedWorkerId} />
        </SidebarContent>

        <SidebarFooter>
          <div className='flex justify-between'>
            Corpusense v{import.meta.env.VITE_APP_VERSION}
            <Link to={CorpusenseRoutes.CONFIGURATION} title={t('page_title_configuration')}>
              <Bolt />
            </Link>
          </div>
        </SidebarFooter>
      </Sidebar>
      <AlertDialogLogin isOpen={isOpen} setIsOpen={setIsOpen} />
    </>
  );
};

export default LayoutSideBar;
