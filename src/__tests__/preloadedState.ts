import { authInitialState } from '@/state/reducers/auth';
import { eventsInitialState } from '@/state/reducers/events';
import { manifestInitialState } from '@/state/reducers/manifests';
import { workerInitialState } from '@/state/reducers/workers';
import { RootState } from '@/state/store';

const defaultPreloadedState: RootState = {
  manifests: manifestInitialState,
  export: {
    lastExportContent: null,
    lastExportDate: null,
    lastExportStatus: 'UNKNOWN',
    lastExportError: '',
  },
  workers: workerInitialState,
  events: eventsInitialState,
  auth: authInitialState,
};

export const getPreloadedState = (partialState: Partial<RootState> = {}): RootState => {
  return {
    ...defaultPreloadedState,
    ...partialState,
  };
};
