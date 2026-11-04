import { Result } from '@/data/models/result/result';
import { Task, Worker, WorkerResponse } from '@/data/models/worker/worker';
import { getIsExperimentalFeaturesActivated } from '@/hooks/useExperimental';
import { Manifest } from '@iiif/presentation-3';
import z from 'zod';

export type WorkerConfigurationParams = {
  [key: string]: { description: string; defaultValue?: string };
};
type WorkerPluginInfo = {
  displayName?: string;
  description?: string;
  category?: string;
  exportFormats?: string[];
  configurationParams?: WorkerConfigurationParams;
};
export type WorkerPlugin = {
  run: WorkerRunFunction;
  executionStrategy: 'synchronous' | 'job';
  export?: WorkerExportFunction;
  extractData?: WorkerExtractDataFunction;
  processResult?: WorkerProcessResultFunction;
  info: WorkerPluginInfo;
  runtimeParametersSchema?: z.ZodTypeAny;
};

type WorkerRunFunction = (task: Task, worker: Worker) => Promise<WorkerResponse>; //saga or async function : if we need to call an effect (eg: call, put, select), we have to use a saga
type WorkerExtractDataFunction = (results: Result[]) => Promise<unknown[]>;
type WorkerExportFunction = (results: Result[], formats: string[]) => void;
type WorkerModule = {
  default: WorkerRunFunction;
  exportResult?: WorkerExportFunction;
  extractData?: WorkerExtractDataFunction;
  processResult?: WorkerProcessResultFunction;
  pluginName: string;
  pluginExecutionStrategy?: 'synchronous' | 'job';
  pluginDisplayName?: string;
  pluginDescription?: string;
  pluginCategory?: string;
  pluginExportFormats?: string[];
  pluginConfigurationParams?: WorkerConfigurationParams;
  pluginRuntimeParameters?: z.ZodTypeAny;
};
type WorkerProcessResultFunction = (
  result: unknown,
  task: Task,
  workerCategory?: string,
) => Promise<WorkerResponse>;

export type ImporterPlugin = { import: ImportFunction };
type ImportFunction = (url: string) => Promise<Manifest>;
type ImporterModule = {
  default: ImportFunction;
  pluginName: string;
};

//typeguard to check if an object is a WorkerModule
const isWorkerModule = (mod: unknown): mod is WorkerModule => {
  if (mod === null || typeof mod !== 'object') return false;

  const m = mod as Partial<WorkerModule>;

  //TODO : il faut valider les types des paramètres de default
  return (
    typeof m.default === 'function' &&
    typeof m.pluginName === 'string' &&
    (m.pluginExecutionStrategy === undefined ||
      m.pluginExecutionStrategy === 'synchronous' ||
      m.pluginExecutionStrategy === 'job') &&
    // les champs optionnels sont simplement ignorés ici
    (m.pluginDisplayName === undefined || typeof m.pluginDisplayName === 'string') &&
    (m.pluginDescription === undefined || typeof m.pluginDescription === 'string') &&
    (m.pluginCategory === undefined || typeof m.pluginCategory === 'string') &&
    (m.pluginExportFormats === undefined ||
      (Array.isArray(m.pluginExportFormats) &&
        m.pluginExportFormats.every((f) => typeof f === 'string'))) &&
    (m.exportResult === undefined || typeof m.exportResult === 'function') &&
    (m.extractData === undefined || typeof m.extractData === 'function') &&
    (m.processResult === undefined || typeof m.processResult === 'function') &&
    (m.pluginConfigurationParams === undefined ||
      (typeof m.pluginConfigurationParams === 'object' &&
        m.pluginConfigurationParams !== null &&
        Object.values(m.pluginConfigurationParams).every(
          (v) =>
            typeof v === 'object' &&
            v !== null &&
            'description' in v &&
            typeof v.description === 'string',
        )))
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
          executionStrategy: mod.pluginExecutionStrategy ?? 'synchronous',
          info: {
            displayName: mod.pluginDisplayName,
            description: mod.pluginDescription,
            category: mod.pluginCategory,
            exportFormats: mod.pluginExportFormats,
            configurationParams: mod.pluginConfigurationParams,
          },
          export: mod.exportResult,
          extractData: mod.extractData,
          processResult: mod.processResult,
          runtimeParametersSchema: mod.pluginRuntimeParameters,
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
    if (typeof mod.default === 'function') {
      importerPlugins[mod.pluginName] = { import: mod.default };
      console.info(`Plugin saga ${mod.pluginName} loaded successfully`);
    } else {
      console.warn(`Plugin saga at ${mod.pluginName} does not export a default generator`);
    }
  }

  return importerPlugins;
}
