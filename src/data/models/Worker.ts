import { PluginParams } from '@/state/reducers/workers';
import { Scope } from './Scope';

export enum WorkerStatus {
  ALL = 'all', // Special status to represent all workers
  WAITING = 'waiting', // Worker is waiting to be processed
  INPROGRESS = 'inprogress', // Worker is currently being processed
  POSTED = 'posted', // Worker has been posted to an external service
  INPROGRESS_WITH_ERRORS = 'inprogress_with_errors', // Worker is being processed but encountered errors
  UNFINISHED = 'unfinished', // Worker has been processed but not completed
  UNFINISHED_WITH_ERRORS = 'unfinished_with_errors', // Worker has been processed but not completed and encountered errors
  COMPLETED = 'completed', // Worker has been successfully completed
  ERROR = 'error', // Worker encountered an error during processing
  COMPLETED_WITH_ERRORS = 'completed_with_errors', // Worker has been completed but with errors
}

export interface Task {
  id: number;
  scope: Scope;
  status: WorkerStatus;
  statusMessage?: string; //optional message to display in the UI
}

export interface Worker {
  id: string;
  name: string;
  scope: Scope;
  batchMode?: boolean;

  scopeKey: string; //needed for indexeddb
  status: WorkerStatus;
  statusMessage?: string; //optional message to display in the UI
  createdAt: string; // ISO date string
  estimatedDuration: number; // ms
  params: PluginParams;
  queue: Task[];
}

export interface WorkerResponse {
  status: WorkerStatus;
  statusMessage?: string; //optional message to display in the UI
  content?: unknown;
}

export interface WorkerCreateDTO {
  name: string;
  scope: Scope;
  params: PluginParams;
  batchMode?: boolean;
}

/*
 * Type guard to check if an object is a Worker.
 * This is used to differentiate between Worker and WorkerCreateDTO. A worker has an id, scopeKey, status, and createdAt properties.
 */
export function isWorker(obj: Worker | WorkerCreateDTO): obj is Worker {
  return 'id' in obj && 'scopeKey' in obj && 'status' in obj && 'createdAt' in obj;
}
