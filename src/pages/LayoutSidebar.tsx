import { useCollectionContext } from '@/components/reducers/CollectionContext';
import { useConnectedUserContext } from '@/components/reducers/ConnectedUserContext';
import { useWorkerContext } from '@/components/reducers/WorkerContext';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import WorkerLabel from '@/components/workers/WorkerLabel';
import { WorkerStatus } from '@/data/models/Worker';
import { useCollections } from '@/hooks/data/collections/useCollections';
import useDialog from '@/hooks/ui/useDialog';
import useAppNavigation, { CorpusenseRoutes } from '@/hooks/useAppNavigation';
import useExperimental from '@/hooks/useExperimental';
import {
  Archive,
  Bolt,
  BookOpen,
  ChevronDown,
  Container,
  CornerDownRight,
  Database,
  Globe,
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

const WorkersSideBarGroup = () => {
  const { t } = useTranslation();
  const workers = useWorkerContext().getWorkersByStatus([
    WorkerStatus.INPROGRESS,
    WorkerStatus.INPROGRESS_WITH_ERRORS,
  ]);

  if (workers.length === 0) {
    return null; // No active workers, nothing to display
  }

  return (
    <SidebarGroup className='h-1/2 overflow-y-auto'>
      <SidebarGroupLabel>{t('nav_workers')}</SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu>
          {workers.map((worker) => (
            <SidebarMenuItem key={worker.id} className='cursor-pointer overflow-hidden'>
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
  const navigation = useAppNavigation();
  const { openedCollections, removeFromOpenedCollections } = useCollectionContext();

  if (openedCollections.length === 0) {
    return null; // No collections opened, nothing to display
  }

  const handleOnClose = async (collectionId: string) => {
    await navigation.goToManifestExplorer();
    removeFromOpenedCollections(collectionId);
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

  const menus = [
    {
      title: t('page_title_iiif_storage'),
      url: CorpusenseRoutes.IIIF_SOURCES,
      icon: Globe,
    },
    {
      title: t('page_title_local_storage'),
      url: CorpusenseRoutes.LOCAL_SOURCES,
      icon: Archive,
    },
  ];

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

const LayoutSideBar = () => {
  const { t } = useTranslation();
  const { logout, user } = useConnectedUserContext();
  const { collections } = useCollections();
  const { openLoginDialog } = useDialog();
  const { experimentalFeaturesActivated } = useExperimental();

  const handleLogout = () => {
    void (async () => {
      await logout();
    })();
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
                <Link to={CorpusenseRoutes.MODIFIERCHAIN}>
                  <Container />
                  <span>{t('page_title_modifierchain_manager')}</span>
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
        <WorkersSideBarGroup />
      </SidebarContent>

      <SidebarFooter>
        <div>
          <SidebarMenuButton>
            <Link to={CorpusenseRoutes.DOCUMENTATION} className='flex space-x-2'>
              <BookOpen />
              <span>{t('page_title_documentation')}</span>
            </Link>
          </SidebarMenuButton>
          <div className='flex justify-between'>
            Corpusense v{import.meta.env.VITE_APP_VERSION}
            <Link to={CorpusenseRoutes.CONFIGURATION} title={t('page_title_configuration')}>
              <Bolt />
            </Link>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default LayoutSideBar;
