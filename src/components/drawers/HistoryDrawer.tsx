import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { resetManifestOpenEvent } from '@/state/reducers/manifests';
import { selectManifestOpenEvent } from '@/state/selectors/manifests';
import { History } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import HistoryNav from '../HistoryNav';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../ui/drawer';

const HistoryDrawer = () => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const manifestOpenEvent = useAppSelector(selectManifestOpenEvent);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      appDispatch(resetManifestOpenEvent());
    }
  }, [isOpen]);

  useEffect(() => {
    if (manifestOpenEvent) {
      setIsOpen(false);
    }
  }, [manifestOpenEvent]);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <button className='soft-button' aria-label={t('btn_open_history')}>
          <History size={16} />
          {t('btn_open_history')}
        </button>
      </DrawerTrigger>
      <DrawerContent className='fixed top-0 left-0 flex h-full w-100 items-center rounded-none border-l bg-white shadow-lg animate-in slide-in-from-left-80'>
        <DrawerHeader>
          <DrawerTitle>{t('btn_open_history')}</DrawerTitle>
        </DrawerHeader>
        <DrawerDescription className='mb-2 max-w-[95%]'>
          {t('info_history_drawer_description')}
        </DrawerDescription>
        <HistoryNav />
        <DrawerFooter>
          <DrawerClose>
            <div className='soft-button'>{t('btn_cancel')}</div>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
export default HistoryDrawer;
