import { Annotation } from '@/data/models/Annotation';
import { RootState } from '@/state/store';

const emptyPreloadedState: RootState = {
  manifests: {
    history: [],
    isLoading: false,
    error: '',
    loadedData: null,
    isLoaded: false,
  },
  canvases: {
    values: {},
  },
  lists: {
    values: [],
    error: '',
    newListEvent: false,
    activeListId: '',
  },
  selection: {
    canvases: [],
    indexStart: -1,
    indexEnd: -1,
  },
  storedItems: {
    items: [],
  },
  navigation: {
    redirectTo: '',
  },
  tags: {
    values: [],
  },
  export: {
    lastExportContent: [],
    lastExportDate: new Date(),
    lastExportStatus: 'UNKNOWN',
    lastExportError: '',
  },
  annotations: {
    values: [],
    isLoading: false,
    deleted: {} as Annotation,
    updated: {} as Annotation,
  },
};

export const getPreloadedState = (partialState: Partial<RootState> = {}): RootState => {
  return {
    ...emptyPreloadedState,
    ...partialState,
  };
};
