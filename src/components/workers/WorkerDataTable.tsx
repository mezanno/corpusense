import { Worker } from '@/data/models/Worker';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '../ui/table';
import { getTaskStatusColor } from './workerUtils';

interface WorkerDataTableProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  selectedWorkerId?: string | null;
  setSelectedWorkerId: (workerId: string) => void;
}

const WorkerDataTable = <TData, TValue>({
  data,
  columns,
  selectedWorkerId,
  setSelectedWorkerId,
}: WorkerDataTableProps<TData, TValue>) => {
  const { t } = useTranslation();
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div>
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
            table.getRowModel().rows.map((row, index) => (
              <TableRow
                key={row.id}
                onClick={() => setSelectedWorkerId(row.getValue('id'))}
                className={`${row.getValue('id') === selectedWorkerId ? 'bg-amber-100 hover:bg-amber-100' : ''} ${getTaskStatusColor((data[index] as Worker).status)} `}
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
