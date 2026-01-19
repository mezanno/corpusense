import { workerPlugins } from '@/App';

//get a configuration param value for a given plugin
export const getValueForPluginParam = (pluginName: string, paramKey: string): string | null => {
  const storageKey = `${pluginName}_${paramKey}`;
  return (
    localStorage.getItem(storageKey) ??
    workerPlugins[pluginName]?.info.configurationParams?.[paramKey]?.defaultValue ??
    null
  );
};
