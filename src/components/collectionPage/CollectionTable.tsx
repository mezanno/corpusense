import { useAlertDialogContext } from '@/components/reducers/useAlertDialogContext';
import { CollectionDetails } from '@/data/models/Collection';
import { useCollections } from '@/hooks/data/collections/useCollections';
import { useTags } from '@/hooks/data/tags/useTags';
import useDialog from '@/hooks/ui/useDialog';
import useAppNavigation from '@/hooks/useAppNavigation';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Copy, Eye, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IconButtonWithTooltip } from '../IconButtonWithTooltip';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import CollectionDataTable from './CollectionDataTable';
import LlmStatus from './LlmStatus';
import OcrStatus from './OcrStatus';

const CollectionTable = () => {
  const { t } = useTranslation();
  const navigation = useAppNavigation();
  const { openDialog } = useAlertDialogContext();
  const { openDupicateCollectionDialog } = useDialog();
  const { removeCollection } = useCollections();
  const { collections } = useCollections();
  const { getLabelById } = useTags();

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

  const handleOpen = async (id: string) => {
    await navigation.goToCollectionInspector(id);
  };

  const handleDuplicate = (collection: CollectionDetails) => {
    openDupicateCollectionDialog(collection);
  };

  const columns: ColumnDef<CollectionDetails, unknown>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
          aria-label='Select all'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(value === true)}
          aria-label='Select row'
        />
      ),
    },
    {
      accessorFn: (row: CollectionDetails) => row.name,
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {t('table_col_title_collection_name')}
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        );
      },
    },
    {
      accessorFn: (row: CollectionDetails) => row.id,
      accessorKey: 'id',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            ID
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        );
      },
      cell: ({ row }) => {
        const id: string = row.getValue('id');
        return <div className='font-mono'>{id.substring(0, 8)}</div>;
      },
    },
    {
      accessorFn: (row: CollectionDetails) => row.contentSize,
      accessorKey: 'contentSize',
      header: t('table_col_title_collection_info'),
      cell: ({ row }) => {
        const contentSize: number = row.getValue('contentSize');
        return contentSize === 0 ? (
          <Badge variant='secondary' className='text-sm'>
            {t('info_empty_collection')}
          </Badge>
        ) : (
          <div className='flex'>
            <Badge className='text-md font-bold'>
              {t('info_number_of_items', { number: contentSize })}
            </Badge>
            <OcrStatus collectionId={row.getValue('id')} />
            <LlmStatus collectionId={row.getValue('id')} />
          </div>
        );
      },
    },
    {
      accessorFn: (row: CollectionDetails) => row.tags,
      accessorKey: 'tags',
      header: t('table_col_title_tags'),
      cell: ({ row }) => {
        const tagIds: string[] = row.getValue('tags');
        return (
          <div className='flex flex-wrap gap-1'>
            {tagIds.map((tagId) => (
              <Badge key={tagId}>{getLabelById(tagId)}</Badge>
            ))}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: t('table_col_title_actions'),
      cell: ({ row }) => {
        const collectionId: string = row.getValue('id');
        return (
          <div className='flex h-full w-full space-x-1'>
            <IconButtonWithTooltip
              tooltip={t('btn_open')}
              onClick={() => void handleOpen(collectionId)}
            >
              <Eye />
            </IconButtonWithTooltip>
            <IconButtonWithTooltip
              tooltip={t('btn_duplicate')}
              onClick={() => void handleDuplicate(row.original)}
            >
              <Copy />
            </IconButtonWithTooltip>
            <IconButtonWithTooltip
              tooltip={t('btn_delete')}
              onClick={() => void handleDelete(collectionId)}
            >
              <Trash2 />
            </IconButtonWithTooltip>
          </div>
        );
      },
    },
  ];

  return <CollectionDataTable data={collections} columns={columns} />;
};

export default CollectionTable;
