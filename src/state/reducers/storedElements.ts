import { StoredElement } from '@/data/models/StoredElement';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface StoredElementState {
  values: StoredElement[];
}

const initialState: StoredElementState = {
  values: [],
};

export const storedElements = createSlice({
  name: 'storedElements',
  initialState,
  reducers: {
    setStoredElements: (state, action: PayloadAction<StoredElement[]>) => {
      state.values = action.payload;
    },
  },
});

export const { setStoredElements } = storedElements.actions;
export default storedElements.reducer;
