import HistoryNav from '@/components/HistoryNav';
import {
  ChevronDown,
  CornerDownRight,
  FolderSearch2,
  List,
  MoreHorizontal,
  ScrollText,
} from 'lucide-react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
// import {
//   Breadcrumb,
//   BreadcrumbItem,
//   BreadcrumbLink,
//   BreadcrumbList,
//   BreadcrumbSeparator,
// } from '../components/ui/breadcrumb';
// import { Separator } from '../components/ui/separator';
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
import { removeFromOpenedCollections, reset } from '@/state/reducers/collections';
import { getOpenedCollections } from '@/state/selectors/collections';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

export const CorpusenseRoutes = {
  MANIFEST: 'manifest',
  COLLECTIONS_MANAGER: 'collections',
  COLLECTION_INSPECTOR: 'collection-inspector',
};

const LayoutSideBar = () => {
  const { t } = useTranslation();
  const openedCollections = useAppSelector(getOpenedCollections);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleOnClose = (collectionId: string) => {
    void navigate(`/${CorpusenseRoutes.COLLECTIONS_MANAGER}`);
    dispatch(removeFromOpenedCollections(collectionId));
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('nav_application')}</SidebarGroupLabel>
          <SidebarMenu>
            {[
              // {
              //   title: 'Home',
              //   url: '/corpusense',
              //   icon: Home,
              // },
              {
                title: t('page_title_manifexplorer'),
                url: CorpusenseRoutes.MANIFEST,
                icon: FolderSearch2,
              },
              {
                title: t('page_title_collection_manager'),
                url: CorpusenseRoutes.COLLECTIONS_MANAGER,
                icon: List,
              },
              // {
              //   title: 'Tags',
              //   url: 'tags',
              //   icon: Tags,
              // },
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
                                    to={`/${CorpusenseRoutes.COLLECTIONS_MANAGER}/${col.id}`}
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
                                  <DropdownMenuItem onClick={() => handleOnClose(col.id as string)}>
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
            {/* <Separator orientation='vertical' className='mr-2 h-4' /> */}
            {/* <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>
                  <BreadcrumbLink href='#'>CorpuSense</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className='hidden md:block' />
              </BreadcrumbList>
            </Breadcrumb> */}
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
