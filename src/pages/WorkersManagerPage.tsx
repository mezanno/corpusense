import ScopeLabel from '@/components/ScopeLabel';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import WorkerDataTable from '@/components/WorkerDataTable';
import WorkerDetails from '@/components/WorkerDetails';
import { getWorkerStatusIcon } from '@/components/workerUtils';
import { Worker, WorkerStatus } from '@/data/models/Worker';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { removeWorkerRequest } from '@/state/reducers/workers';
import { selectWorkersByStatus } from '@/state/selectors/workers';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Trash } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

type Filter = {
  status: WorkerStatus;
  selected: boolean;
};

const WorkersManagerPage = () => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const { workerId } = useParams();
  const [filters, setFilters] = useState<Filter[]>(
    Object.values(WorkerStatus).map((status) => ({
      status,
      selected: true,
    })),
  );
  const workers = useAppSelector((state) =>
    selectWorkersByStatus(
      state,
      filters.filter((f) => f.selected).map((f) => f.status),
    ),
  );

  const initialSelectedWorkerId =
    workerId !== undefined && workers.find((w) => w.id === workerId) ? workerId : null;
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(initialSelectedWorkerId);

  const handleDeleteWorker = (id: string) => {
    appDispatch(removeWorkerRequest(id));
  };

  const columns: ColumnDef<Worker, unknown>[] = [
    {
      accessorFn: (row: Worker) => row.id,
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorFn: (row: Worker) => row.name,
      accessorKey: 'name',
      header: 'Nom du traitement',
    },
    {
      accessorFn: (row: Worker) => row.scope,
      accessorKey: 'scope',
      header: 'Scope',
      cell: ({ row }) => {
        return <ScopeLabel scope={row.getValue('scope')} />;
      },
    },
    {
      accessorFn: (row: Worker) => row.status,
      accessorKey: 'status',
      header: 'Status',
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
      header: 'Créé le',
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

  const updateFilter = (filter: Filter) => {
    if (filter.status === WorkerStatus.ALL) {
      const allSelected = filters.every((f) => f.selected);
      setFilters((prev) => prev.map((f) => ({ ...f, selected: !allSelected })));
      return;
    } else {
      setFilters((prev) =>
        prev.map((f) => (f.status === filter.status ? { ...f, selected: !f.selected } : f)),
      );
    }
  };

  return (
    <div className='panel h-full w-full'>
      <ResizablePanelGroup direction='horizontal'>
        <ResizablePanel minSize={50} defaultSize={70}>
          <div className='flex h-full flex-col'>
            <div className='m-2 flex flex-wrap space-y-2 space-x-2'>
              {filters.map((filter) => (
                <div key={filter.status} onClick={() => updateFilter(filter)}>
                  <input
                    type='checkbox'
                    checked={filter.selected}
                    readOnly
                    className='mr-2 h-4 w-4 cursor-pointer'
                  />
                  {t(`worker_status_${filter.status}`)}
                </div>
              ))}
            </div>
            <WorkerDataTable
              columns={columns}
              data={workers}
              selectedWorkerId={selectedWorkerId}
              setSelectedWorkerId={setSelectedWorkerId}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel minSize={30}>
          {selectedWorkerId !== null ? (
            <WorkerDetails workerId={selectedWorkerId} />
          ) : (
            <div className='flex h-full items-center justify-center'>
              {t('info_no_worker_selected')}
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default WorkersManagerPage;
