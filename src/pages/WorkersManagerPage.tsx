import { useWorkerContext } from '@/components/reducers/WorkerContext';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import WorkerDetails from '@/components/WorkerDetails';
import WorkerTable from '@/components/workers/WorkerTable';
import { WorkerStatus } from '@/data/models/Worker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

type Filter = {
  status: WorkerStatus;
  selected: boolean;
};

const WorkersManagerPage = () => {
  const { t } = useTranslation();
  const { workerId } = useParams();
  const [filters, setFilters] = useState<Filter[]>(
    Object.values(WorkerStatus).map((status) => ({
      status,
      selected: true,
    })),
  );
  const workers = useWorkerContext()
    .getWorkersByStatus(filters.filter((f) => f.selected).map((f) => f.status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const initialSelectedWorkerId =
    workerId !== undefined && workers.find((w) => w.id === workerId) ? workerId : null;
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(initialSelectedWorkerId);

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
          <div className='flex h-full flex-col overflow-y-auto'>
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
