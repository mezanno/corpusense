import { Result } from '@/data/models/Result';

export type PluginSaga = { run: PluginRunFunction; export?: PluginExportFunction };
export type PluginRunFunction = (params?: Record<string, unknown>) => Generator;
export type PluginExportFunction = (results: Result[]) => Generator;

type PluginModule = {
  default: PluginRunFunction;
  pluginName: string;
  exportResult?: (results: Result[]) => Generator;
};

export function loadPluginSagas() {
  const modules = import.meta.glob('./*.ts', { eager: true });
  const pluginSagas: Record<string, PluginSaga> = {};

  for (const path in modules) {
    //TODO : check if it is a valid plugin saga
    const mod = modules[path] as PluginModule;
    console.log('mod: ', mod);

    if (typeof mod.default === 'function') {
      pluginSagas[mod.pluginName] = { run: mod.default };
      if (typeof mod.exportResult === 'function') {
        pluginSagas[mod.pluginName].export = mod.exportResult;
      }
      console.info(`Plugin saga ${mod.pluginName} loaded successfully`);
    } else {
      console.warn(`Plugin saga at ${mod.pluginName} does not export a default generator`);
    }
  }

  return pluginSagas;
}
