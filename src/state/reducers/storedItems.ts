import { StoredItem } from '@/data/models/StoredItem';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface StoredItemsState {
  items: StoredItem[];
}

const initialState: StoredItemsState = {
  items: [],
};

export const storedItemsSlice = createSlice({
  name: 'storedItems',
  initialState,
  reducers: {
    setStoredItems: (state, action: PayloadAction<StoredItem[]>) => {
      state.items = action.payload;
    },
  },
});

export const { setStoredItems } = storedItemsSlice.actions;
export default storedItemsSlice.reducer;
