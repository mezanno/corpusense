/* eslint-disable @typescript-eslint/no-misused-promises */
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import {
  fetchManifestFromArkRequest,
  fetchManifestFromContentRequest,
  fetchManifestFromUrlRequest,
} from '@/state/reducers/manifests';
import { getManifestURL } from '@/state/selectors/manifests';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from './ui/button';
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
});

const ManifestURLForm = () => {
  const dispatch = useAppDispatch();
  //currentManifestId is the current manifest URL or '' is null
  const currentManifestId = useAppSelector(getManifestURL) ?? '';
  const form = useForm<z.infer<typeof urlFormSchema>>({
    resolver: zodResolver(urlFormSchema),
    defaultValues: {
      url: currentManifestId,
    },
  });
  function onSubmit(values: z.infer<typeof urlFormSchema>) {
    dispatch(fetchManifestFromUrlRequest(values.url));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full space-y-4'>
        <FormField
          control={form.control}
          name='url'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Manifest URL</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit'>Open</Button>
      </form>
    </Form>
  );
};

const contentFormSchema = z.object({
  json: z.string().min(100, { message: "This doesn't look like a valid manifest" }),
});

const ManifestPastForm = () => {
  const dispatch = useAppDispatch();

  const form = useForm<z.infer<typeof contentFormSchema>>({
    resolver: zodResolver(contentFormSchema),
  });

  function onSubmit(values: z.infer<typeof contentFormSchema>) {
    dispatch(fetchManifestFromContentRequest(values.json));
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
                <FormLabel>Manifest content</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className='max-h-3.5 resize-none'
                    placeholder='Paste the content of the manifest here'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type='submit'>Open</Button>
        </form>
      </Form>
    </div>
  );
};

const arkFormSchema = z.object({
  ark: z.string(), //.length(10, { message: 'This doesn’t look like a valid ARK identifier' }),
});

const ManifestArkForm = () => {
  const dispatch = useAppDispatch();

  const form = useForm<z.infer<typeof arkFormSchema>>({
    resolver: zodResolver(arkFormSchema),
  });

  function onSubmit(values: z.infer<typeof arkFormSchema>) {
    dispatch(fetchManifestFromArkRequest(values.ark));
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
                <FormLabel className='w-auto text-right'>ARK identifier - ark:/1248/</FormLabel>
                <FormControl className='w-1/2'>
                  <Input {...field} placeholder='xxx1234567890' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type='submit'>Open</Button>
        </form>
      </Form>
    </div>
  );
};

const DrawerTabs = () => {
  return (
    <Tabs className='w-1/2 items-center' defaultValue='url'>
      <TabsList>
        <TabsTrigger value='url'>I&apos;ve got an URL</TabsTrigger>
        <TabsTrigger value='paste'>I want to paste the content</TabsTrigger>
        <TabsTrigger value='ark'>I&apos;ve got an ARK identifier</TabsTrigger>
      </TabsList>
      <TabsContent value='url' className='w-full'>
        <ManifestURLForm />
      </TabsContent>
      <TabsContent value='paste' className='w-full'>
        <ManifestPastForm />
      </TabsContent>
      <TabsContent value='ark' className='w-full'>
        <ManifestArkForm />
      </TabsContent>
    </Tabs>
  );
};

const ManifestExplorerDrawer = () => {
  return (
    <Drawer>
      <DrawerTrigger
        className='cursor-pointer rounded-full border-1 border-slate-300 bg-white p-3 shadow-md'
        aria-label='Open manifest dialog'
      >
        <ExternalLink />
      </DrawerTrigger>
      <DrawerContent className='flex items-center bg-white'>
        <DrawerHeader>
          <DrawerTitle>Open a Manifest</DrawerTitle>
          <DrawerDescription>Set a URL or paste the content of a manifest</DrawerDescription>
        </DrawerHeader>

        <DrawerTabs />

        <DrawerFooter>
          <DrawerClose>
            <div className='rounded-md border border-black p-2'>Cancel</div>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export { DrawerTabs, ManifestExplorerDrawer };
export default ManifestExplorerDrawer;
