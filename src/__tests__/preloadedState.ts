import { eventsInitialState } from '@/state/reducers/events';
import { workerInitialState } from '@/state/reducers/workers';
import { RootState } from '@/state/store';

const defaultPreloadedState: RootState = {
  workers: workerInitialState,
  events: eventsInitialState,
};

export const getPreloadedState = (partialState: Partial<RootState> = {}): RootState => {
  return {
    ...defaultPreloadedState,
    ...partialState,
  };
};
