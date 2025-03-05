import { Tag } from '@/data/models/Tag';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TagState {
  values: Tag[];
}

const initialState: TagState = {
  values: [],
};

export const tagSlice = createSlice({
  name: 'typeList',
  initialState,
  reducers: {
    addNewTag: (_state, _action: PayloadAction<string>) => {},
    setTags: (state, action: PayloadAction<Tag[]>) => {
      state.values = action.payload;
    },
    newTagAdded: (state, action: PayloadAction<Tag>) => {
      state.values.push(action.payload);
    },
  },
});

export const { addNewTag, setTags, newTagAdded } = tagSlice.actions;
export default tagSlice.reducer;
