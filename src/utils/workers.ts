import { workerPlugins } from '@/App';

export const getWorkerCategory = (workerName: string): string | undefined => {
  const worker = workerPlugins[workerName];
  return worker?.info.category;
};
