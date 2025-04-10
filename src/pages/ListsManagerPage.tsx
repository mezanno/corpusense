/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { List } from '@/data/models/List';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import {
  exportMultipleCollectionsRequest,
  exportRequest,
  resetAlert,
} from '@/state/reducers/export';
import {
  addListRequest,
  importMultipleCollections,
  importOneCollection,
  removeListRequest,
} from '@/state/reducers/lists';
import { getLists } from '@/state/selectors/lists';
import { getTagsByIds } from '@/state/selectors/tags';
import { zodResolver } from '@hookform/resolvers/zod';
import { DownloadIcon, PenLine, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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

const ListTableRow = ({
  list,
  addOrRemoveCollection,
}: {
  list: List;
  addOrRemoveCollection: (listId: string, isAdd: boolean) => void;
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { lastExportContent, lastExportDate, lastExportStatus } = useAppSelector(
    (state) => state.export,
  );
  const tags = useAppSelector((state) => getTagsByIds(state, list.tags));

  const [downloadLink, setDownloadLink] = useState<string>('');

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
    void navigate(`/lists/${id}`);
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
    <TableRow onClick={() => handleOnClick(list.id as string)}>
      <TableCell>
        <Checkbox
          onClick={(e) => {
            e.stopPropagation();
            addOrRemoveCollection(
              list.id as string,
              (e.target as HTMLInputElement).dataset['state'] === 'unchecked',
            );
          }}
        />
      </TableCell>
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
      <TableCell className='space-y-1 space-x-1'>
        {tags.map((tag) => (
          <Badge key={tag?.id}>{tag?.label}</Badge>
        ))}
      </TableCell>
      <TableCell className='space-x-2 align-middle'>
        <Button
          variant='destructive'
          onClick={(event) => {
            event.stopPropagation();
            handleDelete(list.id as string);
          }}
          title={t('btn_delete')}
          aria-label={t('btn_delete')}
        >
          <Trash2 />
        </Button>
        <Button
          onClick={(e) => handleExport(e, list.id as string)}
          aria-label={t('btn_create_export')}
          title={t('btn_create_export')}
        >
          <PenLine aria-label={t('btn_create_export')} />
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
  );
};

const UploadFileForm = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      console.log(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          try {
            const jsonContent = JSON.parse(content) as object;
            dispatch(importOneCollection(jsonContent));
          } catch (error) {
            console.error('Error parsing JSON:', error);
          }
        } else if (content instanceof ArrayBuffer) {
          dispatch(importMultipleCollections(content));
        } else {
          console.error('Unsupported file type');
        }
      };
      if (file.name.endsWith('.zip')) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    }
  };

  return (
    <div className='flex flex-col items-center gap-1.5 rounded-2xl border-2 border-gray-200 p-2'>
      <Label htmlFor='collectionFile'>Fichier</Label>
      <Input id='collectionFile' type='file' onChange={handleFileChange} />
      {file && <Button onClick={handleImport}>{t('btn_import')}</Button>}
    </div>
  );
};

const ListsManagerPage = () => {
  const dispatch = useAppDispatch();
  const lists: List[] = useAppSelector(getLists);
  const { t } = useTranslation();

  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);

  const addOrRemoveCollection = (id: string, isAdd: boolean) => {
    if (isAdd) {
      if (!selectedCollections.includes(id)) {
        setSelectedCollections(selectedCollections.concat(id));
      }
    } else {
      setSelectedCollections(selectedCollections.filter((collection) => collection !== id));
    }
  };

  const handleExport = () => {
    dispatch(exportMultipleCollectionsRequest(selectedCollections));
  };

  return (
    <main className='flex h-full w-full flex-col items-center space-y-4 rounded-2xl border-1 bg-white'>
      <div className='flex w-full flex-col items-center justify-center'>
        <Accordion type='single' collapsible className='w-1/2 lg:w-1/3'>
          <AccordionItem value='new-list'>
            <AccordionTrigger>{t('btn_create_list')}</AccordionTrigger>
            <AccordionContent>
              <div className='rounded-2xl border-2 border-gray-200 p-2'>
                <NewListForm />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <Accordion type='single' collapsible className='w-1/2 lg:w-1/3'>
          <AccordionItem value='import-list'>
            <AccordionTrigger>{t('btn_import_collection')}</AccordionTrigger>
            <AccordionContent>
              <UploadFileForm />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {lists.length > 0 ? (
        <section className='flex h-full w-4/5 flex-col items-center space-y-1'>
          <div className='text-xl'>{t('info_number_of_lists', { number: lists.length })}</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>{t('table_col_title_listname')}</TableHead>
                <TableHead>{t('table_col_title_listinfo')}</TableHead>
                <TableHead>{t('table_col_title_tags')}</TableHead>
                <TableHead>{t('table_col_title_actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lists.map((list) => (
                <ListTableRow
                  list={list}
                  key={list.id}
                  addOrRemoveCollection={addOrRemoveCollection}
                />
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>
                  {t('info_selection')} {selectedCollections.length} / {lists.length}
                </TableCell>
                <TableCell>
                  {selectedCollections.length > 0 ? (
                    <Button
                      onClick={handleExport}
                      aria-label={t('btn_create_export')}
                      title={t('btn_create_export')}
                    >
                      <PenLine aria-label={t('btn_create_export')} />
                    </Button>
                  ) : (
                    <div>-</div>
                  )}
                </TableCell>
              </TableRow>
            </TableFooter>
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
