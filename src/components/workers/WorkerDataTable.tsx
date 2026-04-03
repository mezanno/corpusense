import { Worker } from '@/data/models/Worker';
import { contains } from '@/data/utils/scope';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '../ui/input';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '../ui/table';
import { getTaskStatusColor } from './workerUtils';

interface WorkerDataTableProps {
  data: Worker[];
  columns: ColumnDef<Worker>[];
  selectedWorkerId?: string | null;
  setSelectedWorkerId: (workerId: string) => void;
}

const WorkerDataTable = ({
  data,
  columns,
  selectedWorkerId,
  setSelectedWorkerId,
}: WorkerDataTableProps) => {
  const { t } = useTranslation();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterValue, setFilterValue] = useState('');
  const [filteredData, setFilteredData] = useState(data);

  useEffect(() => {
    let isCancelled = false;
    async function applyFilter() {
      if (!filterValue) {
        if (!isCancelled) setFilteredData(data);
        return;
      }

      const result = await Promise.all(
        data.map(async (worker) => {
          const match = await contains(worker.scope, filterValue);
          return match ? worker : null;
        }),
      );

      if (!isCancelled) {
        setFilteredData(result.filter((w): w is Worker => w !== null));
      }
    }

    void applyFilter();
    return () => {
      isCancelled = true;
    };
  }, [filterValue, data]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div>
      <div className='flex items-center py-4'>
        <Input
          placeholder={t('form_label_filter_worker_table')}
          value={filterValue}
          onChange={(event) => setFilterValue(event.target.value)}
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
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => setSelectedWorkerId(row.getValue('id'))}
                className={`${row.getValue('id') === selectedWorkerId ? 'bg-amber-100 hover:bg-amber-100' : ''} ${getTaskStatusColor(row.original.status)} `}
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
      </Table>
    </div>
  );
};

export default WorkerDataTable;
