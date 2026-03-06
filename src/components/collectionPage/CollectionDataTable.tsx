import { CollectionDetails } from '@/data/models/Collection';
import useDialog from '@/hooks/ui/useDialog';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  RowSelectionState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { DownloadIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface CollectionDataTableProps {
  data: CollectionDetails[];
  columns: ColumnDef<CollectionDetails>[];
}

const CollectionDataTable = ({ data, columns }: CollectionDataTableProps) => {
  const { t } = useTranslation();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      rowSelection,
      columnFilters,
    },
  });
  const { openExportCollectionDialog } = useDialog();

  const handleExport = () => {
    const selectedCollectionIds = table.getSelectedRowModel().rows.map((row) => row.original.id);
    openExportCollectionDialog(selectedCollectionIds);
  };

  return (
    <div className='w-full'>
      <div className='flex items-center py-4'>
        <Input
          placeholder={t('form_label_filter_collection_table')}
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
          className='max-w-sm'
        />
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row, _index) => (
              <TableRow
                key={row.id}
                // onClick={() => void handleOnClick(row.getValue('id'))}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className='px-2 py-1'>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <td colSpan={columns.length} className='h-24 text-center'>
                {t('info_there_is_no_worker')}
              </td>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={5}>
              {t('info_selection')} {table.getFilteredSelectedRowModel().rows.length} /{' '}
              {table.getFilteredRowModel().rows.length}
            </TableCell>
            <TableCell>
              {table.getFilteredSelectedRowModel().rows.length > 0 ? (
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
    </div>
  );
};

export default CollectionDataTable;
