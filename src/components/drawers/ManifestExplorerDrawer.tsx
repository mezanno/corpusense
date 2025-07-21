/* eslint-disable @typescript-eslint/no-misused-promises */
import { Textarea } from '@/components/ui/textarea';
import { EventType } from '@/data/models/Event';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import useAppNavigation from '@/hooks/useAppNavigation';
import { fecthManifestRequest, resetManifestOpenEvent } from '@/state/reducers/manifests';
import { getManifestOpenEvent, getManifestURL } from '@/state/selectors/manifests';
import { zodResolver } from '@hookform/resolvers/zod';
import { FolderOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '../ui/button';
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
import { Form, FormControl, FormField, FormItem, FormMessage } from '../ui/form';

const contentFormSchema = z.object({
  manifestInput: z.string(),
});

const ManifestPastForm = ({ handleClose }: handleCloseProps) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const currentManifestId = useAppSelector(getManifestURL) ?? '';
  const manifestOpenEvent = useAppSelector(getManifestOpenEvent);
  const navigation = useAppNavigation();
  const [error, setError] = useState<string | undefined>(undefined);

  const form = useForm<z.infer<typeof contentFormSchema>>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      manifestInput: currentManifestId,
    },
  });

  function onSubmit(values: z.infer<typeof contentFormSchema>) {
    dispatch(fecthManifestRequest(values.manifestInput));
  }

  useEffect(() => {
    async function goToManifestExplorer() {
      await navigation.goToManifestExplorer();
    }

    if (manifestOpenEvent !== undefined) {
      if (manifestOpenEvent.type === EventType.INFO) {
        void goToManifestExplorer();
        handleClose();
      } else {
        setError(manifestOpenEvent.message);
      }
    }
  }, [manifestOpenEvent]);

  return (
    <div className='grid w-1/2 gap-2'>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex w-full flex-col items-center space-y-4'
        >
          <FormField
            control={form.control}
            name='manifestInput'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormControl>
                  <Textarea
                    {...field}
                    className='max-h-3.5 w-full resize-none'
                    placeholder={t('form_placeholder_manifest_content')}
                  />
                </FormControl>
                <FormMessage>{error}</FormMessage>
              </FormItem>
            )}
          />
          <Button type='submit'>{t('btn_open')}</Button>
        </form>
      </Form>
    </div>
  );
};

interface handleCloseProps {
  handleClose: () => void;
}

const ManifestExplorerDrawer = () => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();

  const [isOpen, setIsOpen] = useState(false);

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
          aria-label={t('btn_open_manifest')}
        >
          <FolderOpen size={16} />
          {t('btn_open_manifest')}
        </button>
      </DrawerTrigger>
      <DrawerContent className='flex w-full items-center bg-white'>
        <DrawerHeader>
          <DrawerTitle>{t('btn_open_manifest')}</DrawerTitle>
        </DrawerHeader>
        <DrawerDescription className='mb-2 max-w-1/2'>
          {t('info_drawer_description')}
        </DrawerDescription>
        <ManifestPastForm handleClose={() => setIsOpen(false)} />
        <DrawerFooter>
          <DrawerClose>
            <div className='rounded-md border border-black p-2'>{t('btn_cancel')}</div>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
export default ManifestExplorerDrawer;
