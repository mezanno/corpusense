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
    createNewTagRequest: (_state, _action: PayloadAction<Tag>) => {},
    setTags: (state, action: PayloadAction<Tag[]>) => {
      state.values = action.payload;
    },
    createNewTagSuccess: (state, action: PayloadAction<Tag>) => {
      state.values.push(action.payload);
    },
  },
});

export const { createNewTagRequest, setTags, createNewTagSuccess } = tagSlice.actions;
export default tagSlice.reducer;
