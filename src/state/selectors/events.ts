import { EventType } from '@/data/models/Event';
import { RootState } from '../store';

export const selectLastInfoEvent = (state: RootState) =>
  state.events.lastEvent?.type === EventType.INFO ? state.events.lastEvent : undefined;

export const selectLastErrorEvent = (state: RootState) =>
  state.events.lastEvent?.type === EventType.ERROR ? state.events.lastEvent : undefined;
