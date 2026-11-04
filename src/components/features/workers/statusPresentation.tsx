import { TaskStatus, WorkerStatus } from '@/data/models/worker/worker';
import { CalendarClock, CircleAlert, CircleCheck, OctagonPause } from 'lucide-react';
import type { ReactNode } from 'react';
import { ClipLoader, ClockLoader, GridLoader } from 'react-spinners';

type StatusPresentation = {
  color: string;
  icon: ReactNode;
};

export const workerStatusPresentation: Record<WorkerStatus, StatusPresentation> = {
  [WorkerStatus.INPROGRESS]: {
    color: 'text-blue-500',
    icon: <GridLoader color='#1c71d8' size={4} />,
  },
  [WorkerStatus.INPROGRESS_WITH_ERRORS]: {
    color: 'text-orange-500',
    icon: <GridLoader color='#1c71d8' size={4} />,
  },
  [WorkerStatus.COMPLETED]: {
    color: 'text-green-700',
    icon: <CircleCheck color='green' />,
  },
  [WorkerStatus.COMPLETED_WITH_ERRORS]: {
    color: 'text-red-500',
    icon: <CircleAlert color='red' />,
  },
  [WorkerStatus.UNFINISHED]: {
    color: 'text-gray-500',
    icon: <OctagonPause color='#000000' />,
  },
  [WorkerStatus.UNFINISHED_WITH_ERRORS]: {
    color: 'text-red-500',
    icon: <CircleAlert color='red' />,
  },
};

export const taskStatusPresentation: Record<TaskStatus, StatusPresentation> = {
  [TaskStatus.WAITING]: {
    color: 'text-yellow-700',
    icon: <ClockLoader size={20} />,
  },
  [TaskStatus.POSTING]: {
    color: 'text-blue-500',
    icon: <ClipLoader size={20} />,
  },
  [TaskStatus.POSTED]: {
    color: 'text-blue-500',
    icon: <CalendarClock />,
  },
  [TaskStatus.INPROGRESS]: {
    color: 'text-blue-500',
    icon: <GridLoader size={10} />,
  },
  [TaskStatus.COMPLETED]: {
    color: 'text-green-700',
    icon: null,
  },
  [TaskStatus.COMPLETED_WITH_ERRORS]: {
    color: 'text-red-500',
    icon: <CircleAlert size={20} color='red' />,
  },
};
