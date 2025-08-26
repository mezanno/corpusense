import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import WorkerDataTable from '@/components/WorkerDataTable';
import WorkerDetails from '@/components/WorkerDetails';
import { getWorkerStatusIcon } from '@/components/workerUtils';
import { toString } from '@/data/models/Scope';
import { Worker, WorkerStatus } from '@/data/models/Worker';
import { useAppSelector } from '@/hooks/hooks';
import { getWorkersByStatus } from '@/state/selectors/workers';
import { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type Filter = {
  status: WorkerStatus;
  selected: boolean;
};

const WorkersManagerPage = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<Filter[]>(
    Object.values(WorkerStatus).map((status) => ({
      status,
      selected: true,
    })),
  );
  const workers = useAppSelector((state) =>
    getWorkersByStatus(
      state,
      filters.filter((f) => f.selected).map((f) => f.status),
    ),
  );
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

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
        return <div>{toString(row.getValue('scope'))}</div>;
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
  ];

  return (
    <div className='panel h-full w-full'>
      <ResizablePanelGroup direction='horizontal'>
        <ResizablePanel>
          <div className='flex h-full flex-col'>
            <div className='m-2 flex flex-wrap space-y-2 space-x-2'>
              {filters.map((filter) => (
                <div
                  key={filter.status}
                  onClick={() =>
                    setFilters((prev) =>
                      prev.map((f) =>
                        f.status === filter.status ? { ...f, selected: !f.selected } : f,
                      ),
                    )
                  }
                >
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
        <ResizablePanel>
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
