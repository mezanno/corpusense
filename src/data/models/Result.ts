import { WorkerScope } from './Worker';

export interface Result {
  id: string;
  scope: WorkerScope;
  workerId: string;
  value: object | string;
}
