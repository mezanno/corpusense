import HistoryNav from '@/components/HistoryNav';
import { CornerDownRight, FolderSearch2, List, MoreHorizontal, ScrollText } from 'lucide-react';
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
import { removeFromOpenedLists, reset } from '@/state/reducers/lists';
import { getOpenedLists } from '@/state/selectors/lists';
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
  LISTS_MANAGER: 'lists',
  LIST_INSPECTOR: 'list-inspector',
};

const LayoutSideBar = () => {
  const { t } = useTranslation();
  const openedLists = useAppSelector(getOpenedLists);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleOnClose = (listId: string) => {
    void navigate('/lists');
    dispatch(removeFromOpenedLists(listId));
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
                title: t('page_title_listmanager'),
                url: CorpusenseRoutes.LISTS_MANAGER,
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
        {openedLists.length > 0 && (
          <SidebarGroup id='lists'>
            <SidebarMenu>
              <Collapsible defaultOpen className='group/collapsible'>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <ScrollText />
                      {t('nav_lists')}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {openedLists.map(
                        (list) =>
                          list.id !== undefined && (
                            <SidebarMenuSubItem key={list.id}>
                              <SidebarMenuSubButton className='h-auto'>
                                <CornerDownRight />
                                <Link
                                  to={`/lists/${list.id}`}
                                  className='h-full w-full'
                                  title={list.name}
                                >
                                  {list.name}
                                </Link>
                              </SidebarMenuSubButton>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <SidebarMenuAction>
                                    <MoreHorizontal />
                                  </SidebarMenuAction>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side='right' align='start'>
                                  <DropdownMenuItem
                                    onClick={() => handleOnClose(list.id as string)}
                                  >
                                    {t('btn_close_list')}
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
  const { newListEvent } = useAppSelector((state) => state.lists);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  useEffect(() => {
    if (newListEvent) {
      toast.success(t('toast_list_created'));
      dispatch(reset());
    }
  }, [newListEvent]);

  return (
    <SidebarProvider>
      <LayoutSideBar />
      <SidebarInset>
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
