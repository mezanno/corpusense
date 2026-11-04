import { toString } from '@/data/models/scope/scope.utils';
import { Task, WorkerResponse } from '@/data/models/worker/worker';
import { PluginParams } from '@/state/reducers/workers';
import { WorkerCategory } from '../WorkerCategory';
import { suryaRun } from './suryaCommon';

export const pluginName = 'surya-ocr';
export const pluginDisplayName = 'Détection de texte Surya';
export const pluginDescription = 'Reconnaissance de texte dans les images.';
export const pluginCategory = WorkerCategory.OCR;
export const experimental = true;

export default async function run(task: Task, _params: PluginParams): Promise<WorkerResponse> {
  console.log(`Processing task for scope ${toString(task.scope)}`);
  return suryaRun(task, 'ocr');
}
