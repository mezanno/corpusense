import { WorkerStatus } from '../reducers/workers';
import { RootState } from '../store';

export const isWorkerRunning = (state: RootState, id: string) => {
  const worker = state.workers[id];
  return worker !== undefined ? worker.status === WorkerStatus.PENDING : false;
};
