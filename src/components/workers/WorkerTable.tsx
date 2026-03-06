import { useAlertDialogContext } from '@/components/reducers/useAlertDialogContext';
import ScopeLabel from '@/components/ScopeLabel';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import WorkerDataTable from '@/components/workers/WorkerDataTable';
import { getWorkerStatusIcon } from '@/components/workers/workerUtils';
import { Worker, WorkerStatus } from '@/data/models/Worker';
import useWorkers from '@/hooks/data/workers/useWorkers';
import { getWorkerCategory } from '@/utils/workers';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WorkerTableProps {
  workers: Worker[];
  selectedWorkerId?: string | null;
  setSelectedWorkerId: (workerId: string) => void;
}

const WorkerTable = (props: WorkerTableProps) => {
  const { workers, selectedWorkerId, setSelectedWorkerId } = props;
  const { t } = useTranslation();
  const { removeWorker } = useWorkers();
  const { openDialog } = useAlertDialogContext();

  const handleDeleteWorker = (id: string) => {
    openDialog({
      title: t('title_are_you_sure'),
      description: t('description_delete_worker'),
      onConfirm: {
        message: t('btn_yes'),
        action: () => void removeWorker(id),
      },
    });
  };

  const columns: ColumnDef<Worker, unknown>[] = [
    {
      accessorFn: (row: Worker) => row.id,
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => {
        const id: string = row.getValue('id');
        return <div className='font-mono'>{id.substring(0, 8)}</div>;
      },
    },
    {
      accessorFn: (row: Worker) => getWorkerCategory(row.name),
      accessorKey: 'type',
      header: t('list_title_worker_category'),
    },
    {
      accessorFn: (row: Worker) => row.name,
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {t('list_title_worker_name')}
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        );
      },
    },
    {
      accessorFn: (row: Worker) => row.scope,
      accessorKey: 'scope',
      header: t('list_title_worker_scope'),
      cell: ({ row }) => {
        return <ScopeLabel scope={row.getValue('scope')} />;
      },
    },
    {
      accessorFn: (row: Worker) => row.status,
      accessorKey: 'status',
      header: t('list_title_worker_status'),
      cell: ({ row }) => {
        const status: WorkerStatus = row.getValue('status');
        const value = t(`worker_status_${status}`);
        return (
          <div className='flex flex-col items-center justify-center space-x-2'>
            {getWorkerStatusIcon(status)}
            {value}
          </div>
        );
      },
    },
    {
      accessorFn: (row: Worker) => row.createdAt,
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {t('list_title_worker_createdAt')}
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
        return <div>{date.toLocaleString()}</div>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost'>
                <span className='sr-only'>{t('btn_open_menu')}</span>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>{t('btn_actions')}</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleDeleteWorker(row.original.id)}
                className='text-destructive'
              >
                <Trash color='red' />
                {t('btn_delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <WorkerDataTable
      columns={columns}
      data={workers}
      selectedWorkerId={selectedWorkerId}
      setSelectedWorkerId={setSelectedWorkerId}
    />
  );
};

export default WorkerTable;
