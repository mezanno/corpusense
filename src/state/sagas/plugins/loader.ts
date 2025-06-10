import { Result } from '@/data/models/Result';

export type WorkerPlugin = { run: WorkerRunFunction; export?: WorkerExportFunction };
export type WorkerRunFunction = (params?: Record<string, unknown>) => Generator;
export type WorkerExportFunction = (results: Result[]) => Generator;
type WorkerModule = {
  default: WorkerRunFunction;
  pluginName: string;
  exportResult?: (results: Result[]) => Generator;
};

export function loadWorkerPlugins() {
  const modules = import.meta.glob('./worker/*.ts', { eager: true });
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
