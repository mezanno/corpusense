import { useAppDispatch } from '@/hooks/hooks';
import { resetManifestOpenEvent } from '@/state/reducers/manifests';
import { PocketKnife } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import WorkerDetails from '../WorkerDetails';
import WorkerSelector from '../WorkerSelector';

const WorkerDrawer = ({
  selectedWorkerId,
  setSelectedWorkerId,
  isOpen,
  setIsOpen,
}: {
  selectedWorkerId: string;
  setSelectedWorkerId: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();

  useEffect(() => {
    if (!isOpen) {
      appDispatch(resetManifestOpenEvent());
    }
  }, [isOpen]);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <button
          className='align-center flex cursor-pointer items-center justify-center gap-2 space-x-2 rounded-xl border-2 bg-white p-2 hover:bg-gray-400 hover:text-white'
          aria-label={t('btn_open_workers')}
        >
          <PocketKnife size={16} />
          {t('btn_open_workers')}
        </button>
      </DrawerTrigger>

      <DrawerContent className='max-h-[33vh] w-full items-center bg-white'>
        <DrawerHeader>
          <DrawerTitle>{t('title_workers')}</DrawerTitle>
        </DrawerHeader>
        <DrawerDescription>{t('description_worker_drawer')}</DrawerDescription>
        <WorkerSelector
          setSelectedWorkerId={setSelectedWorkerId}
          selectedWorkerId={selectedWorkerId}
        />
        {selectedWorkerId !== '' && <WorkerDetails workerId={selectedWorkerId} />}
        <DrawerFooter>
          <DrawerClose>
            <div className='rounded-md border border-black p-2'>{t('btn_cancel')}</div>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
export default WorkerDrawer;
