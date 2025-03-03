import { RootState } from '@/state/store';

const emptyPreloadedState: RootState = {
  manifests: {
    history: [],
    isLoading: false,
    error: '',
    data: null,
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
  storedElements: {
    values: [],
  },
};

export const getPreloadedState = (partialState: Partial<RootState> = {}): RootState => {
  return {
    ...emptyPreloadedState,
    ...partialState,
  };
};
