import { Result } from '@/data/models/Result';
import { Task } from '@/data/models/Worker';

export type WorkerPlugin = { run: WorkerRunFunction; export?: WorkerExportFunction };
export type WorkerRunFunction = (task: Task, params?: Record<string, unknown>) => Generator;
export type WorkerExportFunction = (results: Result[]) => Generator;
type WorkerModule = {
  default: WorkerRunFunction;
  pluginName: string;
  exportResult?: WorkerExportFunction;
};

export type ImporterPlugin = { import: ImportFunction };
export type ImportFunction = (url: string) => Generator;
type ImporterModule = {
  default: ImportFunction;
  pluginName: string;
};

export function loadWorkerPlugins() {
  const modules = import.meta.glob('./workers/*.ts', { eager: true });
  const workerPlugins: Record<string, WorkerPlugin> = {};

  for (const path in modules) {
    //TODO : check if it is a valid plugin saga
    const mod = modules[path] as WorkerModule;
    console.log('mod: ', mod);

    if (typeof mod.default === 'function') {
      workerPlugins[mod.pluginName] = { run: mod.default };
      if (typeof mod.exportResult === 'function') {
        workerPlugins[mod.pluginName].export = mod.exportResult;
      }
      console.info(`Plugin saga ${mod.pluginName} loaded successfully`);
    } else {
      console.warn(`Plugin saga at ${mod.pluginName} does not export a default generator`);
    }
  }

  return workerPlugins;
}

export function loadImporterPlugins() {
  const modules = import.meta.glob('./importers/*.ts', { eager: true });
  const importerPlugins: Record<string, ImporterPlugin> = {};

  for (const path in modules) {
    //TODO : check if it is a valid plugin saga
    const mod = modules[path] as ImporterModule;
    console.log('mod: ', mod);

    if (typeof mod.default === 'function') {
      importerPlugins[mod.pluginName] = { import: mod.default };
      console.info(`Plugin saga ${mod.pluginName} loaded successfully`);
    } else {
      console.warn(`Plugin saga at ${mod.pluginName} does not export a default generator`);
    }
  }

  return importerPlugins;
}
