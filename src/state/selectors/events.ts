import { EventType } from '@/data/models/Event';
import { RootState } from '../store';

export const getLastInfoEvent = (state: RootState) =>
  state.events.lastEvent?.type === EventType.INFO ? state.events.lastEvent : undefined;

export const getLastErrorEvent = (state: RootState) =>
  state.events.lastEvent?.type === EventType.ERROR ? state.events.lastEvent : undefined;
