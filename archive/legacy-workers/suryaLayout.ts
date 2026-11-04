import { toString } from '@/data/models/scope/scope.utils';
import { Task, WorkerResponse } from '@/data/models/worker/worker';
import { PluginParams } from '@/state/reducers/workers';
import { WorkerCategory } from '../WorkerCategory';
import { suryaRun } from './suryaCommon';

export const pluginName = 'surya-layout';
export const pluginDisplayName = 'Détection de layout Surya';
export const pluginDescription =
  'Détection et extraction de structures de mise en page (paragraphes, titres, images, tableaux, etc.) dans les images.';
export const pluginCategory = WorkerCategory.LAYOUT;
export const experimental = true;

export default async function run(task: Task, _params: PluginParams): Promise<WorkerResponse> {
  console.log(`Processing task for scope ${toString(task.scope)}`);
  return await suryaRun(task, 'layout');
}
