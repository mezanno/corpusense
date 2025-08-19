import { Annotation } from '@/data/models/Annotation';
import { authInitialState } from '@/state/reducers/auth';
import { eventsInitialState } from '@/state/reducers/events';
import { manifestInitialState } from '@/state/reducers/manifests';
import { modelsInitialState } from '@/state/reducers/models';
import { workerInitialState } from '@/state/reducers/workers';
import { RootState } from '@/state/store';

const defaultPreloadedState: RootState = {
  manifests: manifestInitialState,
  canvases: {
    values: {},
  },
  collections: {
    values: [],
    openedCollections: [],
  },
  selection: {
    canvases: [],
    indexStart: -1,
    indexEnd: -1,
  },
  tags: {
    values: [],
  },
  export: {
    lastExportContent: null,
    lastExportDate: null,
    lastExportStatus: 'UNKNOWN',
    lastExportError: '',
  },
  annotations: {
    values: [],
    isLoading: false,
    deleted: {} as Annotation,
    updated: {} as Annotation,
  },
  workers: workerInitialState,
  models: modelsInitialState,
  entities: [],
  events: eventsInitialState,
  auth: authInitialState,
};

export const getPreloadedState = (partialState: Partial<RootState> = {}): RootState => {
  return {
    ...defaultPreloadedState,
    ...partialState,
  };
};
