import AlertDialogLogin from '@/components/auth/AlertDialogLogin';
import HistoryNav from '@/components/HistoryNav';
import ManifestExplorerDrawer from '@/components/ManifestExplorerDrawer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/sonner';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import useAppNavigation, { CorpusenseRoutes } from '@/hooks/useAppNavigation';
import { logoutRequest } from '@/state/reducers/auth';
import { removeFromOpenedCollections } from '@/state/reducers/collections';
import { resetLastEvent } from '@/state/reducers/events';
import { connectedUser } from '@/state/selectors/auth';
import { getOpenedCollections } from '@/state/selectors/collections';
import { getLastErrorEvent, getLastInfoEvent } from '@/state/selectors/events';
import {
  Bolt,
  ChevronDown,
  Container,
  CornerDownRight,
  FolderSearch2,
  List,
  MoreHorizontal,
  ScrollText,
  User2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from '../components/ui/sidebar';

const LayoutSideBar = () => {
  const { t } = useTranslation();
  const user = useAppSelector(connectedUser);
  const openedCollections = useAppSelector(getOpenedCollections);
  const navigation = useAppNavigation();
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);

  const handleOnClose = async (collectionId: string) => {
    await navigation.goToManifestExplorer();
    dispatch(removeFromOpenedCollections(collectionId));
  };

  const handleLogout = () => {
    dispatch(logoutRequest());
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
          <SidebarGroup>
            <SidebarGroupLabel>{t('nav_application')}</SidebarGroupLabel>
            <SidebarMenu>
              {[
                {
                  title: t('page_title_manifexplorer'),
                  url: CorpusenseRoutes.MANIFEST,
                  icon: FolderSearch2,
                },
                {
                  title: t('page_title_collection_manager'),
                  url: CorpusenseRoutes.COLLECTIONS,
                  icon: List,
                },
                {
                  title: t('page_title_models_manager'),
                  url: CorpusenseRoutes.MODELS,
                  icon: Container,
                },
                {
                  title: t('page_title_storage'),
                  url: CorpusenseRoutes.STORAGE,
                  icon: Container,
                },
              ].map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
          {openedCollections.length > 0 && (
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
                                    <DropdownMenuItem
                                      onClick={() => void handleOnClose(col.id as string)}
                                    >
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
          )}
          <SidebarGroup id='history'>
            <SidebarGroupLabel>{t('nav_history')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <HistoryNav />
            </SidebarGroupContent>
          </SidebarGroup>
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

const Layout = () => {
  // const { lastExportError, lastExportStatus } = useAppSelector((state) => state.export);
  const lastInfo = useAppSelector(getLastInfoEvent);
  const lastError = useAppSelector(getLastErrorEvent);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (lastInfo !== undefined) {
      toast.success(lastInfo.message);
      dispatch(resetLastEvent());
    }
  }, [lastInfo]);

  useEffect(() => {
    if (lastError !== undefined) {
      toast.error(lastError.message);
      dispatch(resetLastEvent());
    }
  }, [lastError]);

  // useEffect(() => {
  //   if (lastExportStatus === 'ERROR' && lastExportError !== '') {
  //     toast.error(t(lastExportError));
  //     dispatch(resetAlert());
  //   }
  // }, [lastExportStatus]);

  return (
    <SidebarProvider className='h-full w-full'>
      <LayoutSideBar />
      <SidebarInset className='m-2'>
        {/*TODO: Fix this width : pour une raison inconnue w-100 empêche la fenêtre de déborder*/}
        <header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
          <div className='flex items-center'>
            <SidebarTrigger />
            <ManifestExplorerDrawer />
          </div>
        </header>
        <Outlet />
        <Toaster position='top-right' expand={true} richColors />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
