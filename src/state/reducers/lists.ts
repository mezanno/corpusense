import { List } from '@/data/models/List';
import { SelectedCanvas } from '@/data/models/SelectedCanvas';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ListsState {
  values: List[];
  error: string;
  activeListId?: string;
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
      state.activeListId = action.payload.id;
    },
    removeListRequest: (_state, _action: PayloadAction<string>) => {},
    removeListSuccess: (state, action: PayloadAction<string>) => {
      const listId: string = action.payload;
      state.values = state.values.filter((elt) => elt.id !== listId);
    },
    updateListRequest: (_state, _action) => {},
    updateListSuccess: (state, action: PayloadAction<List>) => {
      const list: List | undefined = state.values.find((elt) => elt.id === action.payload.id);
      if (list !== undefined) {
        list.name = action.payload.name;
        list.about = action.payload.about;
        list.tags = action.payload.tags;
      }
    },
    setLists: (state, action: PayloadAction<List[]>) => {
      state.values = action.payload;
    },
    setActiveList: (state, action: PayloadAction<string>) => {
      state.activeListId = action.payload;
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
    createListWithSelectionRequest: (
      _state,
      _action: PayloadAction<{ selection: SelectedCanvas[]; name: string }>,
    ) => {},
    fetchCanvasesOfListRequest: (_state, _action: PayloadAction<string>) => {},
    fetchCanvasesOfListSuccess: (state, action: PayloadAction<List>) => {
      // const list: List = state.values.find((elt) => elt.id === action.payload.id);
      console.log(
        'fetchCanvasesOfListSuccess: ',
        state.values.find((elt) => elt.id === action.payload.id),
      );
    },
    removeElementFromList: (
      _state,
      _action: PayloadAction<{ listId: string; canvasId: string }>,
    ) => {},
    removeElementFromListSuccess: (state, action: PayloadAction<List>) => {
      const list: List | undefined = state.values.find((elt) => elt.id === action.payload.id);
      if (list && list.content !== undefined) {
        list.content = action.payload.content;
      }
    },
  },
});

export const {
  addListRequest,
  addListSuccess,
  removeListSuccess,
  removeListRequest,
  updateListRequest,
  updateListSuccess,
  setLists,
  setActiveList,
  addSelectionToListRequest,
  addSelectionToListSuccess,
  createListWithSelectionRequest,
  removeElementFromList,
  removeElementFromListSuccess,
  // removeSelectionFromList,
} = listsSlice.actions;
export default listsSlice.reducer;
