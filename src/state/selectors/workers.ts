import { RootState } from '../store';

export const selectHasExport = (state: RootState, workerName: string) =>
  state.workers.workerPluginsInfo?.some(
    (plugin) => plugin.name === workerName && plugin.hasExport,
  ) ?? false;

export const selectExportFormats = (state: RootState, workerName: string) => {
  const plugin = state.workers.workerPluginsInfo?.find((wp) => wp.name === workerName);
  return plugin?.exportFormats ?? [];
};

export const selectWorkerPluginsInfo = (state: RootState) => state.workers.workerPluginsInfo;
