import { Annotation } from '@/data/models/Annotation';
import { modelsInitialState } from '@/state/reducers/models';
import { workerInitialState } from '@/state/reducers/workers';
import { RootState } from '@/state/store';

const defaultPreloadedState: RootState = {
  manifests: {
    history: [],
    isLoading: false,
    lastError: null,
    loadedData: null,
    isLoaded: false,
  },
  canvases: {
    values: {},
  },
  collections: {
    values: [],
    lastError: '',
    newCollectionEvent: false,
    openedCollections: [],
  },
  selection: {
    canvases: [],
    indexStart: -1,
    indexEnd: -1,
  },
  storedItems: {
    items: [],
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
};

export const getPreloadedState = (partialState: Partial<RootState> = {}): RootState => {
  return {
    ...defaultPreloadedState,
    ...partialState,
  };
};
