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
import useDialog from '@/hooks/ui/useDialog';
import useAppNavigation, { CorpusenseRoutes } from '@/hooks/useAppNavigation';
import useExperimental from '@/hooks/useExperimental';
import { logoutRequest } from '@/state/reducers/auth';
import { removeFromOpenedCollections } from '@/state/reducers/collections';
import { selectConnectedUser } from '@/state/selectors/auth';
import { selectCollections, selectOpenedCollections } from '@/state/selectors/collections';
import { selectWorkersByStatus } from '@/state/selectors/workers';
import {
  Archive,
  Bolt,
  ChevronDown,
  Container,
  CornerDownRight,
  Database,
  FolderSearch2,
  List,
  MoreHorizontal,
  PocketKnife,
  ScrollText,
  User2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '../components/ui/sidebar';

const WorkersSideBarGroup = ({
  setSelectedWorkerId,
}: {
  setSelectedWorkerId: (id: string) => void;
}) => {
  const { t } = useTranslation();
  const workers = useAppSelector((state) =>
    selectWorkersByStatus(state, [WorkerStatus.INPROGRESS, WorkerStatus.INPROGRESS_WITH_ERRORS]),
  );

  if (workers.length === 0) {
    return null; // No active workers, nothing to display
  }

  return (
    <SidebarGroup className='h-1/2 overflow-y-auto'>
      <SidebarGroupLabel>{t('nav_workers')}</SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu>
          {workers.map((worker) => (
            <SidebarMenuItem
              key={worker.id}
              className='cursor-pointer overflow-hidden'
              onClick={() => setSelectedWorkerId(worker.id)}
            >
              <SidebarMenuButton asChild>
                <Link
                  to={`/${CorpusenseRoutes.WORKERS}/${worker.id}`}
                  className='h-full w-full'
                  title={worker.name}
                >
                  <WorkerLabel worker={worker} />
                </Link>
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
  const openedCollections = useAppSelector(selectOpenedCollections);

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
                            <CornerDownRight color='#fcfbf6' />
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
  const { experimentalFeaturesActivated } = useExperimental();

  const menus = [
    {
      title: t('page_title_manifexplorer'),
      url: CorpusenseRoutes.MANIFEST,
      icon: FolderSearch2,
    },
  ];
  if (experimentalFeaturesActivated) {
    menus.push({
      title: t('page_title_storage'),
      url: CorpusenseRoutes.STORAGE,
      icon: Archive,
    });
  }

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
                {menus.map((item) => (
                  <SidebarMenuSubItem key={item.title}>
                    <SidebarMenuSubButton className='h-auto' asChild>
                      <Link to={item.url}>
                        <item.icon color='#fcfbf6' />
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
  const appDispatch = useAppDispatch();
  const user = useAppSelector(selectConnectedUser);
  const collections = useAppSelector(selectCollections);
  const { openLoginDialog } = useDialog();
  const { experimentalFeaturesActivated } = useExperimental();
  console.log(experimentalFeaturesActivated);

  const handleLogout = () => {
    appDispatch(logoutRequest());
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader className='w-full bg-white'>
          <Link className='flex items-center justify-center' to={'/'}>
            <img src={`${import.meta.env.VITE_BASE_PATH}/images/logo.png`} className='w-2/3'></img>
          </Link>
        </SidebarHeader>
        {experimentalFeaturesActivated && (
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
                      <DropdownMenuItem onClick={openLoginDialog}>Se connecter</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
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
            <CollectionsSideBarGroup />
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to={CorpusenseRoutes.MODELS}>
                  <Container />
                  <span>{t('page_title_models_manager')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to={CorpusenseRoutes.WORKERS}>
                  <PocketKnife />
                  <span>{t('page_title_workers_manager')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
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
  );
};

export default LayoutSideBar;
