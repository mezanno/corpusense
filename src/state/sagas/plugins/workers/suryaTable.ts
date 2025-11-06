import { toString } from '@/data/models/Scope';
import { Task, WorkerResponse } from '@/data/models/Worker';
import { PluginParams } from '@/state/reducers/workers';
import { suryaRun } from './suryaCommon';

export const pluginName = 'surya-table';
export const pluginDisplayName = 'Détection de tableaux Surya';
export const pluginDescription = 'Détection et extraction de tableaux dans les images.';
export const pluginCategory = 'Layout';
export const experimental = true;

export default async function run(task: Task, _params: PluginParams): Promise<WorkerResponse> {
  console.log(`Processing task for scope ${toString(task.scope)}`);
  return suryaRun(task, 'table');
}
