/* eslint-disable @typescript-eslint/no-misused-promises */
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
import { Progress } from '@/components/ui/progress';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { fetchManifestRequest } from '@/state/reducers/manifests';
import { getCanvasForCanvas } from '@/state/selectors/canvas';
import { getManifestURL } from '@/state/selectors/manifests';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { createWorker } from 'tesseract.js';
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
  url: z.string().url("This doesn't look like a valid URL"),
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
    console.log('onSubmit: ', values);

    dispatch(fetchManifestRequest(values.url));
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

const ManifestViewer = () => {
  const canvasImage = useAppSelector(getCanvasForCanvas('test'));
  const [progress, setProgress] = useState(0);
  const [working, setWorking] = useState(false);

  const handleGetOcr = async () => {
    if (!canvasImage) return;

    setWorking(true);
    const worker = await createWorker('fra', 1, {
      logger: (m) => {
        console.log(m);
        setProgress(m.progress * 100);
      },
    });
    console.log('OCR ', canvasImage);
    const {
      data: { text },
    } = await worker.recognize(canvasImage.id as string);
    console.log(text);
    await worker.terminate();
    setWorking(false);
  };

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
          <div className='relative h-full w-full bg-amber-200'>
            <CanvasImageViewer />
            <button
              className='absolute top-0 right-0 m-4 rounded-md bg-white p-2 shadow-md'
              onClick={handleGetOcr}
            >
              OCR
            </button>
            {working && (
              <div className='absolute top-0 left-0 flex h-full w-full items-center justify-center'>
                <Progress value={progress} className='w-[60%]' />
              </div>
            )}
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
