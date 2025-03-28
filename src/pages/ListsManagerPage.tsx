/* eslint-disable @typescript-eslint/no-misused-promises */
import CanvasListViewer from '@/components/CanvasListViewer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { List } from '@/data/models/List';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { exportRequest, resetAlert } from '@/state/reducers/export';
import { addListRequest, removeListRequest, setActiveList } from '@/state/reducers/lists';
import { getCanvasesOfList, getLists } from '@/state/selectors/lists';
import { zodResolver } from '@hookform/resolvers/zod';
import { Canvas } from '@iiif/presentation-3';
import { DownloadIcon, PenLine, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(4, {
    message: 'Le nom de la liste doit contenir au moins 4 caractères',
  }),
});

const NewListForm = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    dispatch(addListRequest(values.name));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full space-y-4'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form_label_listname')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit'>{t('btn_create')}</Button>
      </form>
    </Form>
  );
};

const ListHoverCard = ({ list }: { list: List }) => {
  // const elements = useAppSelector(getElemntsOfList(list.id as string));
  const canvases = useAppSelector((state) => getCanvasesOfList(state, list.id as string));

  const { t } = useTranslation();
  return (
    <div className='flex flex-col justify-between space-x-4'>
      <h4>{list.name}</h4>
      {list.content === undefined || list.content.length === 0 ? (
        <div>{t('info_empty_list')}</div>
      ) : (
        <div>
          <div>{t('info_number_of_items', { number: list.content.length })}</div>
          <div>
            <CanvasListViewer
              width={500}
              height={150}
              size={4}
              layout='horizontal'
              canvases={canvases.map((canvas) => canvas.content as Canvas)}
              handleCardClick={() => console.log('click')}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const ListsManagerPage = () => {
  const lists: List[] = useAppSelector(getLists);
  const dispatch = useAppDispatch();
  const { lastExportContent, lastExportDate, lastExportStatus } = useAppSelector(
    (state) => state.export,
  );

  const [downloadLink, setDownloadLink] = useState<string>('');

  const { t } = useTranslation();

  useEffect(() => {
    if (lastExportDate !== null) {
      const blob = new Blob([lastExportContent as string], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      setDownloadLink(url);

      dispatch(resetAlert());
    }
  }, [lastExportContent]);

  const handleDelete = (id: string) => {
    dispatch(removeListRequest(id));
  };

  const handleOnClick = (id: string) => {
    dispatch(setActiveList(id));
  };

  const handleExport = (event: React.MouseEvent<HTMLButtonElement | MouseEvent>, id: string) => {
    console.log(event);
    event.stopPropagation();
    event.preventDefault();

    dispatch(exportRequest(id));
  };

  const handleDownload = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.stopPropagation();
    const link = document.createElement('a');
    link.href = downloadLink;
    link.download = 'export.csv';
    link.click();
  };

  return (
    <main className='flex h-full w-full flex-col items-center space-y-4 rounded-2xl border-1 bg-white'>
      <Accordion type='single' collapsible className='w-1/4'>
        <AccordionItem value='new-list'>
          <AccordionTrigger>{t('btn_create_list')}</AccordionTrigger>
          <AccordionContent>
            <div className='rounded-2xl border-2 border-gray-200 p-2'>
              <NewListForm />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {lists.length > 0 ? (
        <section className='flex h-full w-2/3 flex-col items-center space-y-1'>
          <div className='text-xl'>{t('info_number_of_lists', { number: lists.length })}</div>
          <Table>
            {/* <TableCaption>Vos Listes</TableCaption> */}
            <TableHeader>
              <TableRow>
                <TableHead>{t('table_col_title_listname')}</TableHead>
                <TableHead>{t('table_col_title_listinfo')}</TableHead>
                <TableHead>{t('table_col_title_actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lists.map((list) => (
                <HoverCard key={list.id}>
                  <HoverCardTrigger asChild>
                    <TableRow onClick={() => handleOnClick(list.id as string)}>
                      <TableCell>{list.name}</TableCell>

                      <TableCell>
                        {list.content === undefined || list.content.length === 0 ? (
                          <Badge variant='secondary' className='text-sm'>
                            {t('info_empty_list')}
                          </Badge>
                        ) : (
                          <Badge className='text-sm'>
                            <span className='text-md font-bold'>
                              {t('info_number_of_items', { number: list.content.length })}
                            </span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className='space-x-2 align-middle'>
                        <Button
                          variant='destructive'
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(list.id as string);
                          }}
                        >
                          <Trash2 />
                          {t('btn_delete')}
                        </Button>
                        <Button onClick={(e) => handleExport(e, list.id as string)}>
                          <PenLine />
                          {t('btn_create_export')}
                        </Button>

                        {lastExportStatus === 'OK' && (
                          <Button
                            className='rounded bg-cyan-400 px-4 py-2 text-slate-900 transition hover:bg-cyan-600 hover:text-white'
                            onClick={(e) => handleDownload(e)}
                          >
                            <DownloadIcon />
                            {t('btn_download_export')}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  </HoverCardTrigger>
                  <HoverCardContent className='w-full'>
                    <ListHoverCard list={list} />
                  </HoverCardContent>
                </HoverCard>
              ))}
            </TableBody>
          </Table>
        </section>
      ) : (
        <div role='alert' className='text-2xl'>
          {t('info_no_list')}
        </div>
      )}
    </main>
  );
};

export default ListsManagerPage;
