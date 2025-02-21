import { useForm } from 'react-hook-form';
import CanvasesViewer from '../components/CanvasesViewer';
import ManifestInfos from '../components/ManifestInfos';
import { Button } from '../components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../components/ui/drawer';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../components/ui/resizable';

import CanvasImageViewer from '@/components/CanvasImageViewer';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { fetchManifest } from '@/state/reducers/manifests';
import { getManifestURL } from '@/state/selectors/manifests';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink } from 'lucide-react';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form';
import { Input } from '../components/ui/input';

const formSchema = z.object({
  url: z.string().url(),
});

const ManifestURLForm = () => {
  const dispatch = useAppDispatch();
  //currentManifestId is the current manifest URL or '' is null
  const currentManifestId = useAppSelector(getManifestURL) ?? '';
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: currentManifestId,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    dispatch(fetchManifest(values.url));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full space-y-4'>
        <FormField
          control={form.control}
          name='url'
          label='Manifest URL'
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

const ManifestViewer = () => {
  return (
    <div className='relative h-full w-full'>
      <Drawer>
        <DrawerTrigger className='shadow- absolute top-2 left-2 cursor-pointer rounded-full border-1 border-slate-300 bg-white p-3 shadow-md'>
          <ExternalLink />
        </DrawerTrigger>
        <DrawerContent className='flex items-center'>
          <DrawerHeader>
            <DrawerTitle>Open a Manifest</DrawerTitle>
            <DrawerDescription>Set a URL or paste the content of a manifest</DrawerDescription>
          </DrawerHeader>

          <div className='w-1/2'>
            <ManifestURLForm />
          </div>

          <DrawerFooter>
            <DrawerClose>
              <div className='rounded-md border border-black p-2'>Cancel</div>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <ResizablePanelGroup direction='horizontal'>
        <ResizablePanel>
          <div className='h-full bg-blue-300'>
            <ManifestInfos />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>
          <div className='h-full bg-orange-400'>
            <CanvasesViewer />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>
          <div className='h-full w-full bg-amber-200'>
            <CanvasImageViewer />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default ManifestViewer;

/*
On est obligé de séparer CanvasesViewer et CanvasImageViewer à cause de Selecto. Si les deux sont dans le même composant, 
Selecto empêche le fonctionnement correct de Annotorious.
*/

//TODO il va falloir attribuer un uuid aux composants qui veulent afficher un CanvasImageViewer (à transmettre dans le store)
