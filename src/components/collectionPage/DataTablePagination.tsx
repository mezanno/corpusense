import { type Table } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  const { t } = useTranslation();
  return (
    <div className='flex items-center justify-between px-2'>
      <div className='flex-1 text-sm text-muted-foreground'>
        {t('info_selection', {
          page: table.getFilteredSelectedRowModel().rows.length || 0,
          totalpage: table.getFilteredRowModel().rows.length,
        })}
      </div>
      <div className='flex items-center space-x-6 lg:space-x-8'>
        <div className='flex items-center space-x-2'>
          <p className='text-sm font-medium'>{t('info_table_collection_rowperpage')}</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className='h-8 w-[70px]'>
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side='top'>
              {[10, 20, 25, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex w-[100px] items-center justify-center text-sm font-medium'>
          {t('info_collection_page', {
            page: table.getState().pagination.pageIndex + 1,
            totalPages: table.getPageCount(),
          })}
        </div>
        <div className='flex items-center space-x-2'>
          <Button
            className='soft-button hidden size-8 lg:flex'
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            title={t('btn_collection_first_page')}
          >
            <span className='sr-only'>{t('btn_collection_first_page')}</span>
            <ChevronsLeft />
          </Button>
          <Button
            className='soft-button size-8'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            title={t('btn_collection_previous_page')}
          >
            <span className='sr-only'>{t('btn_collection_previous_page')}</span>
            <ChevronLeft />
          </Button>
          <Button
            className='soft-button size-8'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            title={t('btn_collection_next_page')}
          >
            <span className='sr-only'>{t('btn_collection_next_page')}</span>
            <ChevronRight />
          </Button>
          <Button
            className='soft-button hidden size-8 lg:flex'
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            title={t('btn_collection_last_page')}
          >
            <span className='sr-only'>{t('btn_collection_last_page')}</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
