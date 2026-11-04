import WorkerDetails from '@/components/features/workers/WorkerDetails';
import WorkerTable from '@/components/features/workers/WorkerTable';
import { useWorkerContext } from '@/components/reducers/WorkerContext';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { WorkerStatus } from '@/data/models/worker/worker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

type FilterStatus = WorkerStatus | 'all';

const WorkersManagerPage = () => {
  const { t } = useTranslation();
  const { workerId } = useParams();
  const statuses = Object.values(WorkerStatus);
  const [selectedStatuses, setSelectedStatuses] = useState<WorkerStatus[]>(statuses);
  const allSelected = selectedStatuses.length === statuses.length;
  const filters = [
    { status: 'all' as const, selected: allSelected },
    ...statuses.map((status) => ({
      status,
      selected: selectedStatuses.includes(status),
    })),
  ];
  const workers = useWorkerContext()
    .getWorkersByStatus(selectedStatuses)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const initialSelectedWorkerId =
    workerId !== undefined && workers.find((w) => w.id === workerId) ? workerId : null;
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(initialSelectedWorkerId);

  const updateFilter = (status: FilterStatus) => {
    if (status === 'all') {
      setSelectedStatuses(allSelected ? [] : statuses);
      return;
    }
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((selected) => selected !== status) : [...prev, status],
    );
  };

  return (
    <div className='panel h-full w-full'>
      <ResizablePanelGroup direction='horizontal'>
        <ResizablePanel minSize={50} defaultSize={70}>
          <div className='flex h-full flex-col overflow-y-auto'>
            <div className='m-2 flex flex-wrap space-y-2 space-x-2'>
              {filters.map((filter) => (
                <div key={filter.status} onClick={() => updateFilter(filter.status)}>
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
            <WorkerTable
              workers={workers}
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
