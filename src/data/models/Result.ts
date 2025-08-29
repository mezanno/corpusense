import { PluginParams } from '@/state/reducers/workers';
import { Scope } from './Scope';

export interface Result {
  id: number;
  scope: Scope;
  scopeKey: string; //needed for indexeddb
  workerName: string;
  workerId: string;
  taskId: number;
  value: unknown;
  params: PluginParams;
}

export interface ResultCreateDTO {
  scope: Scope;
  workerName: string;
  workerId: string;
  taskId: number;
  value: unknown;
  params: PluginParams;
}
