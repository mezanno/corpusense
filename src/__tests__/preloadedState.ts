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
};

export const getPreloadedState = (partialState: Partial<RootState> = {}): RootState => {
  return {
    ...emptyPreloadedState,
    ...partialState,
  };
};
