import { WorkerStatus } from '@/data/models/Worker';
import { CalendarClock, CircleAlert, CircleCheck, OctagonPause } from 'lucide-react';
import { GridLoader } from 'react-spinners';

const getWorkerStatusIcon = (status: WorkerStatus): JSX.Element => {
  switch (status) {
    case WorkerStatus.WAITING:
      return <CalendarClock color='#e5a50a' />;
    case WorkerStatus.INPROGRESS:
    case WorkerStatus.INPROGRESS_WITH_ERRORS:
      return <GridLoader color='#1c71d8' size={4} />;
    case WorkerStatus.COMPLETED:
      return <CircleCheck color='green' />;
    case WorkerStatus.ERROR:
      return <CircleAlert color='red' />;
    default:
      return <OctagonPause color='#000000' />;
  }
};

const getTaskStatusColor = (status: WorkerStatus): string => {
  switch (status) {
    case WorkerStatus.WAITING:
      return 'text-yellow-500';
    case WorkerStatus.INPROGRESS:
      return 'text-blue-500';
    case WorkerStatus.INPROGRESS_WITH_ERRORS:
      return 'text-orange-500';
    case WorkerStatus.COMPLETED:
      return 'text-green-700';
    case WorkerStatus.ERROR:
    case WorkerStatus.COMPLETED_WITH_ERRORS:
      return 'text-red-500';
    default:
      return 'text-gray-500'; // Default color for unknown status
  }
};

export { getTaskStatusColor, getWorkerStatusIcon };
