import { Tag } from '@/data/models/Tag';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TagState {
  values: Tag[];
}

const initialState: TagState = {
  values: [],
};

export const tagSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {
    createTagRequest: (_state, _action: PayloadAction<Tag>) => {},
    setTags: (state, action: PayloadAction<Tag[]>) => {
      state.values = action.payload;
    },
    createTagSuccess: (state, action: PayloadAction<Tag>) => {
      state.values.push(action.payload);
    },
  },
});

export const { createTagRequest, setTags, createTagSuccess } = tagSlice.actions;
export default tagSlice.reducer;
