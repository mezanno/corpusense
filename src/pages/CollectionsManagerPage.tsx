import NewCollectionForm from '@/components/NewCollectionForm';
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
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import UploadFileForm from '@/components/UploadFileForm';
import { Collection } from '@/data/models/Collection';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import useAppNavigation from '@/hooks/useAppNavigation';
import { removeCollectionRequest } from '@/state/reducers/collections';
import {
  exportMultipleCollectionsRequest,
  exportRequest,
  resetAlert,
} from '@/state/reducers/export';
import { getCollections } from '@/state/selectors/collections';
import { getTagsByIds } from '@/state/selectors/tags';
import { DownloadIcon, PenLine, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const CollectionTableRow = ({
  collection,
  addOrRemoveCollection,
}: {
  collection: Collection;
  addOrRemoveCollection: (collectionId: string, isAdd: boolean) => void;
}) => {
  const { t } = useTranslation();
  const navigation = useAppNavigation();
  const dispatch = useAppDispatch();
  const { lastExportContent, lastExportDate, lastExportStatus } = useAppSelector(
    (state) => state.export,
  );
  const tags = useAppSelector((state) => getTagsByIds(state, collection.tags));

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
    dispatch(removeCollectionRequest(id));
  };

  const handleOnClick = async (id: string) => {
    await navigation.goToCollectionExplorer(id);
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
    <TableRow onClick={() => void handleOnClick(collection.id as string)}>
      <TableCell>
        <Checkbox
          onClick={(e) => {
            e.stopPropagation();
            addOrRemoveCollection(
              collection.id as string,
              (e.target as HTMLInputElement).dataset['state'] === 'unchecked',
            );
          }}
        />
      </TableCell>
      <TableCell>{collection.name}</TableCell>
      <TableCell>
        {collection.content === undefined || collection.content.length === 0 ? (
          <Badge variant='secondary' className='text-sm'>
            {t('info_empty_collection')}
          </Badge>
        ) : (
          <Badge className='text-sm'>
            <span className='text-md font-bold'>
              {t('info_number_of_items', { number: collection.content.length })}
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
            handleDelete(collection.id as string);
          }}
          title={t('btn_delete')}
          aria-label={t('btn_delete')}
        >
          <Trash2 />
        </Button>
        <Button
          onClick={(e) => handleExport(e, collection.id as string)}
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

const CollectionsManagerPage = () => {
  const dispatch = useAppDispatch();
  const collections: Collection[] = useAppSelector(getCollections);
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
          <AccordionItem value='new-collection'>
            <AccordionTrigger>{t('btn_create_collection')}</AccordionTrigger>
            <AccordionContent>
              <div className='rounded-2xl border-2 border-gray-200 p-2'>
                <NewCollectionForm />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <Accordion type='single' collapsible className='w-1/2 lg:w-1/3'>
          <AccordionItem value='import-collection'>
            <AccordionTrigger>{t('btn_import_collection')}</AccordionTrigger>
            <AccordionContent>
              <UploadFileForm />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {collections.length > 0 ? (
        <section className='flex h-full w-4/5 flex-col items-center space-y-1'>
          <div className='text-xl'>
            {t('info_number_of_collections', { number: collections.length })}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>{t('table_col_title_collection_name')}</TableHead>
                <TableHead>{t('table_col_title_collection_info')}</TableHead>
                <TableHead>{t('table_col_title_tags')}</TableHead>
                <TableHead>{t('table_col_title_actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collections.map((col) => (
                <CollectionTableRow
                  collection={col}
                  key={col.id}
                  addOrRemoveCollection={addOrRemoveCollection}
                />
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>
                  {t('info_selection')} {selectedCollections.length} / {collections.length}
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
          {t('info_no_collection')}
        </div>
      )}
    </main>
  );
};

export default CollectionsManagerPage;
