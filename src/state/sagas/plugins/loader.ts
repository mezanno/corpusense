export type PluginSaga = (params?: Record<string, unknown>) => Generator;

type PluginModule = {
  default: PluginSaga;
  pluginName: string;
};

export function loadPluginSagas() {
  const modules = import.meta.glob('./*.ts', { eager: true });
  const pluginSagas: Record<string, PluginSaga> = {};

  for (const path in modules) {
    //TODO : check if it is a valid plugin saga
    const mod = modules[path] as PluginModule;
    // console.log('mod: ', mod);

    if (typeof mod.default === 'function') {
      pluginSagas[mod.pluginName] = mod.default;
      console.info(`Plugin saga ${mod.pluginName} loaded successfully`);
    } else {
      console.warn(`Plugin saga at ${mod.pluginName} does not export a default generator`);
    }
  }

  return pluginSagas;
}
