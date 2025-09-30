import { Result } from '@/data/models/Result';
import { Task, WorkerResponse } from '@/data/models/Worker';
import { getIsExperimentalFeaturesActivated } from '@/hooks/useExperimental';

export type WorkerPluginInfo = {
  displayName?: string;
  description?: string;
  category?: string;
  exportFormats?: string[];
};
export type WorkerPlugin = {
  run: WorkerRunFunction;
  export?: WorkerExportFunction;
  info: WorkerPluginInfo;
};
export type WorkerRunFunction = (
  task: Task,
  params?: Record<string, unknown>,
) => Promise<WorkerResponse>; //saga or async function : if we need to call an effect (eg: call, put, select), we have to use a saga
export type WorkerExportFunction = (results: Result[], formats: string[]) => void;
type WorkerModule = {
  default: WorkerRunFunction;
  pluginName: string;
  pluginDisplayName?: string;
  pluginDescription?: string;
  pluginCategory?: string;
  pluginExportFormats?: string[];
  exportResult?: WorkerExportFunction;
};

export type ImporterPlugin = { import: ImportFunction };
export type ImportFunction = (url: string) => Promise<object>;
type ImporterModule = {
  default: ImportFunction;
  pluginName: string;
};

//typeguard to check if an object is a WorkerModule
const isWorkerModule = (mod: unknown): mod is WorkerModule => {
  if (mod === null || typeof mod !== 'object') return false;

  const m = mod as Partial<WorkerModule>;

  return (
    typeof m.default === 'function' &&
    typeof m.pluginName === 'string' &&
    // les champs optionnels sont simplement ignorés ici
    (m.pluginDisplayName === undefined || typeof m.pluginDisplayName === 'string') &&
    (m.pluginDescription === undefined || typeof m.pluginDescription === 'string') &&
    (m.pluginCategory === undefined || typeof m.pluginCategory === 'string') &&
    (m.pluginExportFormats === undefined ||
      (Array.isArray(m.pluginExportFormats) &&
        m.pluginExportFormats.every((f) => typeof f === 'string'))) &&
    (m.exportResult === undefined || typeof m.exportResult === 'function')
  );
};

export function loadWorkerPlugins() {
  const modules = import.meta.glob('./workers/*.ts', { eager: true });
  const workerPlugins: Record<string, WorkerPlugin> = {};

  const experimentalFeaturesEnabled = getIsExperimentalFeaturesActivated();

  for (const path in modules) {
    const mod = modules[path] as WorkerModule;
    if (isWorkerModule(mod)) {
      // If experimental features are enabled, load all plugins.
      // If not, only load plugins that are not marked as experimental.
      if (
        experimentalFeaturesEnabled === true ||
        (experimentalFeaturesEnabled === false && !('experimental' in mod))
      ) {
        workerPlugins[mod.pluginName] = {
          run: mod.default,
          info: {
            displayName: mod.pluginDisplayName,
            description: mod.pluginDescription,
            category: mod.pluginCategory,
            exportFormats: mod.pluginExportFormats,
          },
          export: mod.exportResult,
        };

        console.info(`Plugin saga ${mod.pluginName} loaded successfully`);
      }
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
