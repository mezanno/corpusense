import AlertDialogForm from '@/components/AlertDialogForm';
import NewCollectionForm from '@/components/NewCollectionForm';
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
import { CollectionDetails } from '@/data/models/Collection';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import useAppNavigation from '@/hooks/useAppNavigation';
import { removeCollectionRequest } from '@/state/reducers/collections';
import { exportMultipleCollectionsRequest } from '@/state/reducers/export';
import { getCollections } from '@/state/selectors/collections';
import { getTagsByIds } from '@/state/selectors/tags';
import { DownloadIcon, FilePlus, Import, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const CollectionTableRow = ({
  collection,
  addOrRemoveCollection,
}: {
  collection: CollectionDetails;
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
    }
  }, [lastExportContent]);

  const handleDelete = (id: string) => {
    dispatch(removeCollectionRequest(id));
  };

  const handleOnClick = async (id: string) => {
    await navigation.goToCollectionInspector(id);
  };

  const handleDownload = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.stopPropagation();
    const link = document.createElement('a');
    link.href = downloadLink;
    link.download = 'export.csv';
    link.click();
  };

  return (
    <TableRow onClick={() => void handleOnClick(collection.id)}>
      <TableCell>
        <Checkbox
          aria-label={t('aria_label_selection_collection')}
          onClick={(e) => {
            e.stopPropagation();
            addOrRemoveCollection(
              collection.id,
              (e.target as HTMLInputElement).dataset['state'] === 'unchecked',
            );
          }}
        />
      </TableCell>
      <TableCell>{collection.name}</TableCell>
      <TableCell>{collection.id}</TableCell>
      <TableCell>
        {collection.contentSize === 0 ? (
          <Badge variant='secondary' className='text-sm'>
            {t('info_empty_collection')}
          </Badge>
        ) : (
          <Badge className='text-md font-bold'>
            {t('info_number_of_items', { number: collection.contentSize })}
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
            handleDelete(collection.id);
          }}
          title={t('btn_delete')}
          aria-label={t('btn_delete')}
        >
          <Trash2 />
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
  const collections: CollectionDetails[] = useAppSelector(getCollections);
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
    <div className='flex h-full w-full flex-col items-center space-y-4 rounded-2xl border-1 bg-white'>
      <section className='mt-2 ml-4 flex w-full space-x-2'>
        <AlertDialogForm
          title={t('btn_create_collection')}
          description={t('description_create_collection')}
          trigger={
            <>
              <FilePlus />
              {t('btn_create_collection')}
            </>
          }
        >
          {({ close }) => <NewCollectionForm close={close} />}
        </AlertDialogForm>
        <AlertDialogForm
          title={t('btn_import_collection')}
          description={t('description_import_collection')}
          trigger={
            <>
              <Import />
              {t('btn_import_collection')}
            </>
          }
        >
          {({ close }) => <UploadFileForm close={close} />}
        </AlertDialogForm>
      </section>

      {collections.length > 0 ? (
        <section className='flex h-full w-4/5 flex-col items-center space-y-1'>
          <h2 className='text-xl'>
            {t('info_number_of_collections', { number: collections.length })}
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>{t('table_col_title_collection_name')}</TableHead>
                <TableHead>{t('table_col_title_collection_id')}</TableHead>
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
                      aria-label={t('btn_export_collection')}
                      title={t('btn_export_collection')}
                    >
                      <DownloadIcon />
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
    </div>
  );
};

export default CollectionsManagerPage;
