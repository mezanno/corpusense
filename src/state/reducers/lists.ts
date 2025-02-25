import { List } from '@/data/models/list';
import { SelectedCanvas } from '@/data/models/selectedCanvas';
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
    addSelectionToListRequest: (
      _state,
      _action: PayloadAction<{ selection: SelectedCanvas[]; listId: string }>,
    ) => {},
    addSelectionToListSuccess: (state, action: PayloadAction<List>) => {
      const list: List | undefined = state.values.find((elt) => elt.id === action.payload.id);
      if (list !== undefined) {
        list.content = action.payload.content;
      }
    },
    fetchCanvasesOfListRequest: (_state, _action: PayloadAction<string>) => {},
    fetchCanvasesOfListSuccess: (state, action: PayloadAction<List>) => {
      // const list: List = state.values.find((elt) => elt.id === action.payload.id);
      console.log(
        'fetchCanvasesOfListSuccess: ',
        state.values.find((elt) => elt.id === action.payload.id),
      );
    },
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
  addSelectionToListRequest,
  addSelectionToListSuccess,
  // removeSelectionFromList,
} = listsSlice.actions;
export default listsSlice.reducer;
