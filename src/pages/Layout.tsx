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
import { removeFromOpenedCollections, reset } from '@/state/reducers/collections';
import { getOpenedCollections } from '@/state/selectors/collections';
import {
  ChevronDown,
  CornerDownRight,
  FolderSearch2,
  List,
  MoreHorizontal,
  ScrollText,
} from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sidebar,
  SidebarContent,
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
  const openedCollections = useAppSelector(getOpenedCollections);
  const navigation = useAppNavigation();
  const dispatch = useAppDispatch();

  const handleOnClose = async (collectionId: string) => {
    await navigation.goToManifestExplorer();
    dispatch(removeFromOpenedCollections(collectionId));
  };

  return (
    <Sidebar>
      <SidebarContent>
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
                                  <SidebarMenuAction>
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
    </Sidebar>
  );
};

const Layout = () => {
  const { newCollectionEvent } = useAppSelector((state) => state.collections);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  useEffect(() => {
    if (newCollectionEvent) {
      toast.success(t('toast_collection_created'));
      dispatch(reset());
    }
  }, [newCollectionEvent]);

  return (
    <SidebarProvider>
      <LayoutSideBar />
      <SidebarInset className='w-100'>
        {/*TODO: Fix this width : pour une raison inconnue w-100 empêche la fenêtre de déborder*/}
        <header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
          <div className='flex items-center gap-2 px-4'>
            <SidebarTrigger className='-ml-1' />
            <ManifestExplorerDrawer />
          </div>
        </header>
        <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
          <Outlet />
          <Toaster />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
