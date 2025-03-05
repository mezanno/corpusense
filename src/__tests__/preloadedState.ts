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
  },
  selection: {
    canvases: [],
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
};

export const getPreloadedState = (partialState: Partial<RootState> = {}): RootState => {
  return {
    ...emptyPreloadedState,
    ...partialState,
  };
};
