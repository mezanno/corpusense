import { Toaster } from '@/components/ui/sonner';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import useDialog from '@/hooks/ui/useDialog';
import useJobRealtime from '@/hooks/useJobRealtime';
import { resetLastEvent } from '@/state/reducers/events';
import { selectLastErrorEvent, selectLastInfoEvent } from '@/state/selectors/events';
import { Mail } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { toast } from 'sonner';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '../components/ui/sidebar';
import LayoutSideBar from './LayoutSidebar';

const Layout = () => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const { openContactUsDialog } = useDialog();
  const lastInfo = useAppSelector(selectLastInfoEvent);
  const lastError = useAppSelector(selectLastErrorEvent);
  useJobRealtime();

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

  return (
    <SidebarProvider>
      <LayoutSideBar />
      <SidebarInset className='flex h-screen min-w-0 flex-col'>
        <div className='flex h-full w-full flex-col p-2'>
          <header className='flex shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
            <div className='flex w-full items-center justify-between space-x-2'>
              <SidebarTrigger />
              <button
                className='soft-button'
                aria-label={t('btn_open_contact')}
                onClick={openContactUsDialog}
              >
                <Mail size={16} />
                {t('btn_open_contact')}
              </button>
            </div>
          </header>
          <main className='min-h-0 flex-1 pt-2'>
            <Outlet />
          </main>
        </div>
        <Toaster position='top-right' expand={true} richColors />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
