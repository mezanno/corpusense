import HistoryNav from '@/components/HistoryNav';
import { FolderSearch2, List, ScrollText } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
// import {
//   Breadcrumb,
//   BreadcrumbItem,
//   BreadcrumbLink,
//   BreadcrumbList,
//   BreadcrumbSeparator,
// } from '../components/ui/breadcrumb';
// import { Separator } from '../components/ui/separator';
import ManifestExplorerDrawer from '@/components/ManifestExplorerDrawer';
import { Toaster } from '@/components/ui/sonner';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { reset } from '@/state/reducers/lists';
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
  SidebarMenuButton,
  SidebarMenuItem,
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

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('application')}</SidebarGroupLabel>
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
              {
                title: t('page_title_listinspector'),
                url: CorpusenseRoutes.LIST_INSPECTOR,
                icon: ScrollText,
              },
              // {
              //   title: 'Tags',
              //   url: 'tags',
              //   icon: Tags,
              // },
              // {
              //   title: 'Export',
              //   url: 'export',
              //   icon: Download,
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
        <SidebarGroup id='history'>
          <SidebarGroupLabel>{t('history')}</SidebarGroupLabel>
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

  useEffect(() => {
    if (newListEvent) {
      toast.success('New list created');
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
