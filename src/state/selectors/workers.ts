import { RootState } from '../store';

export const selectExportFormats = (state: RootState, workerName: string) => {
  const plugin = state.workers.workerPluginsInfo?.find((wp) => wp.name === workerName);
  return plugin?.exportFormats ?? [];
};

export const selectWorkerPluginsInfo = (state: RootState) => state.workers.workerPluginsInfo;
