import { eventsInitialState } from '@/state/reducers/events';
import { manifestInitialState } from '@/state/reducers/manifests';
import { workerInitialState } from '@/state/reducers/workers';
import { RootState } from '@/state/store';

const defaultPreloadedState: RootState = {
  manifests: manifestInitialState,
  workers: workerInitialState,
  events: eventsInitialState,
};

export const getPreloadedState = (partialState: Partial<RootState> = {}): RootState => {
  return {
    ...defaultPreloadedState,
    ...partialState,
  };
};
