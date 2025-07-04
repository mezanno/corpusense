import { PluginParams } from '@/state/reducers/workers';
import { Scope } from './Scope';

export enum WorkerStatus {
  WAITING = 'waiting', // Worker is waiting to be processed
  INPROGRESS = 'inprogress', // Worker is currently being processed
  UNFINISHED = 'unfinished', // Worker has been processed but not completed
  COMPLETED = 'completed', // Worker has been successfully completed
  ERROR = 'error', // Worker encountered an error during processing
}

export interface Worker {
  id: string;
  name: string;
  scope: Scope;
  scopeKey: string; //needed for indexeddb
  status: WorkerStatus;
  createdAt: string; // ISO date string
  params: PluginParams;
}

export interface WorkerCreateDTO {
  name: string;
  scope: Scope;
  params: PluginParams;
}

export function isWorker(obj: Worker | WorkerCreateDTO): obj is Worker {
  return 'id' in obj && 'scopeKey' in obj && 'status' in obj && 'createdAt' in obj;
}
