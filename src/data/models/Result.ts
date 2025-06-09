import { WorkerScope } from './Worker';

export interface Result {
  id: number;
  scope: WorkerScope;
  workerId: string;
  value: object | string;
}

export interface ResultCreateDTO {
  scope: WorkerScope;
  workerId: string;
  value: object | string;
}
