import { Event, EventType } from '@/data/models/Event';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface EventsState {
  lastEvent: Event | undefined;
  allEvents: Event[];
}

export const eventsInitialState: EventsState = {
  lastEvent: undefined,
  allEvents: [],
};

export const eventsSlice = createSlice({
  name: 'events',
  initialState: eventsInitialState,
  reducers: {
    pushInfo: (state, action: PayloadAction<string>) => {
      const newEvent: Event = { message: action.payload, type: EventType.INFO };
      state.lastEvent = newEvent;
      state.allEvents.push(newEvent);
    },
    pushError: (state, action: PayloadAction<string>) => {
      const newEvent: Event = { message: action.payload, type: EventType.ERROR };
      state.lastEvent = newEvent;
      state.allEvents.push(newEvent);
    },
    resetLastEvent: (state) => {
      //we need this to avoid the last event being displayed again on new renders
      state.lastEvent = undefined;
    },
  },
});

export const { pushInfo, pushError, resetLastEvent } = eventsSlice.actions;
export default eventsSlice.reducer;
