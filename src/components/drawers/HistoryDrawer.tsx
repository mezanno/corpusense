import { useAppSelector } from '@/hooks/hooks';
import { History } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
  const firstTime = useRef(true); //nécessaire si on veut ouvrir le drawer et qu'un manifest est déjà chargé
  const { loadedData, isLoading } = useAppSelector((state) => state.manifests);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (loadedData !== null && !firstTime.current) {
      setIsOpen(false);
    }
  }, [loadedData]);

  // If a manifest is loading, we consider it's not the first time anymore
  useEffect(() => {
    if (isLoading) {
      firstTime.current = false;
    }
  }, [isLoading]);

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
