import ContactDrawer from '@/components/drawers/ContactDrawer';
import HistoryDrawer from '@/components/drawers/HistoryDrawer';
import ManifestExplorerDrawer from '@/components/drawers/ManifestExplorerDrawer';
import { Toaster } from '@/components/ui/sonner';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { resetLastEvent } from '@/state/reducers/events';
import { selectLastErrorEvent, selectLastInfoEvent } from '@/state/selectors/events';
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { toast } from 'sonner';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '../components/ui/sidebar';
import LayoutSideBar from './LayoutSidebar';

const Layout = () => {
  const appDispatch = useAppDispatch();
  const lastInfo = useAppSelector(selectLastInfoEvent);
  const lastError = useAppSelector(selectLastErrorEvent);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    if (lastInfo !== undefined) {
      toast.success(lastInfo.message);
      appDispatch(resetLastEvent());
    }
  }, [lastInfo]);

  useEffect(() => {
    if (lastError !== undefined) {
      toast.error(lastError.message);
      appDispatch(resetLastEvent());
    }
  }, [lastError]);

  useEffect(() => {
    if (selectedWorkerId !== '') {
      setIsOpen(true);
    }
  }, [selectedWorkerId]);

  // Reset selected worker when drawer closes (if not, the drawer will not reopen)
  useEffect(() => {
    if (!isOpen) {
      setSelectedWorkerId('');
    }
  }, [isOpen]);

  return (
    <SidebarProvider className='h-full w-full'>
      <LayoutSideBar setSelectedWorkerId={setSelectedWorkerId} />
      <SidebarInset className='m-2'>
        {/*TODO: Fix this width : pour une raison inconnue w-100 empêche la fenêtre de déborder*/}
        <header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
          <div className='flex items-center space-x-2'>
            <SidebarTrigger />
            <ManifestExplorerDrawer />
            <HistoryDrawer />
            <ContactDrawer />
          </div>
        </header>
        <Outlet />
        <Toaster position='top-right' expand={true} richColors />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
