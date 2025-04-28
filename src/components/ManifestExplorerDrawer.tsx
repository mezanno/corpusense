/* eslint-disable @typescript-eslint/no-misused-promises */
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import useAppNavigation from '@/hooks/useAppNavigation';
import {
  fetchManifestFromArkRequest,
  fetchManifestFromContentRequest,
} from '@/state/reducers/manifests';
import { getManifestURL } from '@/state/selectors/manifests';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { boolean, z } from 'zod';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';

const urlFormSchema = z.object({
  url: z.string(), //.url("This doesn't look like a valid URL"),
  forceV3: boolean().optional(),
});

const ManifestURLForm = ({ handleClose }: handleCloseProps) => {
  const { t } = useTranslation();
  const navigation = useAppNavigation();

  //currentManifestId is the current manifest URL or '' is null
  const currentManifestId = useAppSelector(getManifestURL) ?? '';
  const form = useForm<z.infer<typeof urlFormSchema>>({
    resolver: zodResolver(urlFormSchema),
    defaultValues: {
      url: currentManifestId,
      forceV3: true,
    },
  });
  async function onSubmit(values: z.infer<typeof urlFormSchema>) {
    await navigation.goToManifestExplorer(values.url, values.forceV3);
    handleClose();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full space-y-4'>
        <FormField
          control={form.control}
          name='url'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form_label_manifesturl')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='forceV3'
          render={({ field }) => (
            <FormItem className='flex items-center space-x-2'>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className='border-1 border-black'
                />
              </FormControl>
              <FormLabel>{t('form_forcev3')}</FormLabel>
            </FormItem>
          )}
        />
        <Button type='submit'>{t('btn_open')}</Button>
      </form>
    </Form>
  );
};

const contentFormSchema = z.object({
  json: z.string().min(100, { message: "This doesn't look like a valid manifest" }),
});

const ManifestPastForm = ({ handleClose }: handleCloseProps) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof contentFormSchema>>({
    resolver: zodResolver(contentFormSchema),
  });

  function onSubmit(values: z.infer<typeof contentFormSchema>) {
    dispatch(fetchManifestFromContentRequest(values.json));
    handleClose();
  }

  return (
    <div className='grid gap-2'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='w-full space-y-4'>
          <FormField
            control={form.control}
            name='json'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form_label_manifest_content')}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className='max-h-3.5 resize-none'
                    placeholder={t('form_placeholder_manifest_content')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type='submit'>{t('btn_open')}</Button>
        </form>
      </Form>
    </div>
  );
};

const arkFormSchema = z.object({
  ark: z.string(), //.length(10, { message: 'This doesn’t look like a valid ARK identifier' }),
});

interface handleCloseProps {
  handleClose: () => void;
}

const ManifestArkForm = ({ handleClose }: handleCloseProps) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof arkFormSchema>>({
    resolver: zodResolver(arkFormSchema),
  });

  function onSubmit(values: z.infer<typeof arkFormSchema>) {
    dispatch(fetchManifestFromArkRequest(values.ark));
    handleClose();
  }

  return (
    <div className='grid gap-2'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='w-full space-y-4'>
          <FormField
            control={form.control}
            name='ark'
            render={({ field }) => (
              <FormItem className='flex w-full items-center justify-center'>
                <FormLabel className='w-auto text-right'>{t('form_label_ark')}</FormLabel>
                <FormControl className='w-1/2'>
                  <Input {...field} placeholder='xxx1234567890' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type='submit'>{t('btn_open')}</Button>
        </form>
      </Form>
    </div>
  );
};

interface DrawerTabsProps {
  setIsOpen?: (isOpen: boolean) => void;
}

const DrawerTabs = ({ setIsOpen }: DrawerTabsProps) => {
  const { t } = useTranslation();

  const handleClose = () => {
    if (setIsOpen) setIsOpen(false);
  };

  return (
    <Tabs className='w-1/2 items-center' defaultValue='url'>
      <TabsList>
        <TabsTrigger value='url'>{t('tab_manifest_url')}</TabsTrigger>
        <TabsTrigger value='paste'>{t('tab_manifest_content')}</TabsTrigger>
        <TabsTrigger value='ark'>{t('tab_manifest_ark')}</TabsTrigger>
      </TabsList>
      <TabsContent value='url' className='w-full'>
        <ManifestURLForm handleClose={handleClose} />
      </TabsContent>
      <TabsContent value='paste' className='w-full'>
        <ManifestPastForm handleClose={handleClose} />
      </TabsContent>
      <TabsContent value='ark' className='w-full'>
        <ManifestArkForm handleClose={handleClose} />
      </TabsContent>
    </Tabs>
  );
};

const ManifestExplorerDrawer = () => {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button className='cursor-pointer' aria-label='Open manifest dialog'>
          <ExternalLink size={16} />
          {t('btn_open_manifest')}
        </Button>
      </DrawerTrigger>
      <DrawerContent className='flex items-center bg-white'>
        <DrawerHeader>
          <DrawerTitle>{t('btn_open_manifest')}</DrawerTitle>
        </DrawerHeader>
        <DrawerDescription>{t('info_drawer_description')}</DrawerDescription>
        <DrawerTabs setIsOpen={setIsOpen} />
        <DrawerFooter>
          <DrawerClose>
            <div className='rounded-md border border-black p-2'>{t('btn_cancel')}</div>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export { DrawerTabs, ManifestExplorerDrawer };
export default ManifestExplorerDrawer;
