import { useAlertDialogContext } from '@/components/reducers/useAlertDialogContext';
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
import { CollectionDetails } from '@/data/models/Collection';
import { useCollections } from '@/hooks/data/collections/useCollections';
import { useTags } from '@/hooks/data/tags/useTags';
import { useAppSelector } from '@/hooks/hooks';
import useDialog from '@/hooks/ui/useDialog';
import useAppNavigation from '@/hooks/useAppNavigation';
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
  const { openDialog } = useAlertDialogContext();
  const { removeCollection } = useCollections();

  const { lastExportContent, lastExportDate, lastExportStatus } = useAppSelector(
    (state) => state.export,
  );

  const tags = useTags().getTagsByIds(collection.tags);

  const [downloadLink, setDownloadLink] = useState<string>('');

  useEffect(() => {
    if (lastExportDate !== null) {
      const blob = new Blob([lastExportContent as string], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      setDownloadLink(url);
    }
  }, [lastExportContent]);

  const handleDelete = (id: string) => {
    openDialog({
      title: t('title_are_you_sure'),
      description: t('description_delete_collection'),
      onConfirm: {
        message: t('btn_yes'),
        action: () => void removeCollection(id),
      },
    });
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
          className='cursor-pointer'
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
  const { t } = useTranslation();
  // const collections: CollectionDetails[] = useAppSelector(selectCollections);
  const { collections } = useCollections();
  const { openImportCollectionDialog, openNewCollectionDialog, openExportCollectionDialog } =
    useDialog();

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
    openExportCollectionDialog(selectedCollections);
  };

  return (
    <div className='panel flex-col items-center space-y-4'>
      <section className='mt-2 ml-4 flex w-full justify-center space-x-2'>
        <button
          className='soft-button'
          title={t('btn_create_collection')}
          onClick={openNewCollectionDialog}
        >
          <FilePlus />
          {t('btn_create_collection')}
        </button>
        <button
          className='soft-button'
          title={t('btn_import_collection')}
          onClick={openImportCollectionDialog}
        >
          <Import />
          {t('btn_import_collection')}
        </button>
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
