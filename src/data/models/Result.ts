import { WorkerScope } from './Worker';

export interface Result {
  id: number;
  scope: WorkerScope;
  scopeKey: string; //needed for indexeddb
  workerName: string;
  workerId: string;
  value: object | string;
}

export interface ResultCreateDTO {
  scope: WorkerScope;
  workerName: string;
  workerId: string;
  value: object | string;
}
