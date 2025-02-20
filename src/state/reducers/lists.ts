import { List } from '@/data/models/list';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ListsState {
  values: List[];
  error: string;
}

const initialState: ListsState = {
  values: [],
  error: '',
};

export const listsSlice = createSlice({
  name: 'lists',
  initialState,
  reducers: {
    addListRequest: (_state, _action: PayloadAction<string>) => {},
    addListSuccess: (state, action: PayloadAction<List>) => {
      state.values.push(action.payload);
    },
    removeListRequest: (_state, _action: PayloadAction<string>) => {},
    removeListSuccess: (state, action: PayloadAction<string>) => {
      const listId: string = action.payload;
      state.values = state.values.filter((elt) => elt.id !== listId);
    },
    // updateList: (state, action) => {
    //   const updatedList = action.payload.updatedList;
    //   const list = state.values.find((elt) => elt.id === updatedList.id);
    //   if (list) {
    //     list.name = updatedList.name;
    //   }
    // },
    setLists: (state, action: PayloadAction<List[]>) => {
      state.values = action.payload;
    },
    // addSelectionToList: (state, action) => {
    //   const selection = action.payload.selection;
    //   const listId = action.payload.listId;
    //   const list = state.values.find((elt) => elt.id === listId);
    //   if (list) {
    //     if (!list.content) {
    //       list.content = [];
    //     }
    //     list.content.push(...selection);
    //   }
    // },
    // removeSelectionFromList: (state, action) => {
    //   const idsToRemove = action.payload.idsToRemove;
    //   const listId = action.payload.listId;
    //   const list = state.values.find((elt) => elt.id === listId);
    //   if (list) {
    //     list.content = list.content.filter((item) => !idsToRemove.includes(item.id));
    //   }
    // },
  },
});

export const {
  addListRequest,
  addListSuccess,
  removeListSuccess,
  removeListRequest,
  // updateList,
  setLists,
  // addSelectionToList,
  // removeSelectionFromList,
} = listsSlice.actions;
export default listsSlice.reducer;
