import { workerPlugins } from '@/App';
import { Worker } from './worker';
import { WorkerCreateDTO } from './worker.dto';

/*
 * Type guard to check if an object is a Worker.
 * This is used to differentiate between Worker and WorkerCreateDTO. A worker has an id, scopeKey, status, and createdAt properties.
 */

export function isWorker(obj: Worker | WorkerCreateDTO): obj is Worker {
  return 'id' in obj && 'scopeKey' in obj && 'status' in obj && 'createdAt' in obj;
}

export const getWorkerCategory = (workerName: string): string | undefined => {
  const worker = workerPlugins[workerName];
  return worker?.info.category;
};
