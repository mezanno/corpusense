import { List } from '@/data/models/List';
import { SelectedCanvas } from '@/data/models/SelectedCanvas';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ListsState {
  values: List[];
  error: string;
  newListEvent: boolean;
  openedLists: List[];
}

const initialState: ListsState = {
  values: [],
  error: '',
  newListEvent: false,
  openedLists: [],
};

export const listsSlice = createSlice({
  name: 'lists',
  initialState,
  reducers: {
    addListRequest: (state, _action: PayloadAction<string>) => {
      state.newListEvent = false;
    },
    addListSuccess: (state, action: PayloadAction<List>) => {
      state.values.push(action.payload);
      if (
        action.payload.id !== undefined &&
        state.openedLists.find((elt) => elt.id === action.payload.id)
      ) {
        state.openedLists.push(action.payload);
      }
      state.newListEvent = true;
    },
    removeListRequest: (_state, _action: PayloadAction<string>) => {},
    removeListSuccess: (state, action: PayloadAction<string>) => {
      const listId: string = action.payload;
      state.values = state.values.filter((elt) => elt.id !== listId);
      state.openedLists = state.openedLists.filter((elt) => elt.id !== listId);
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
      if (state.openedLists.find((elt) => elt.id === action.payload) === undefined) {
        state.openedLists.push(state.values.find((elt) => elt.id === action.payload) as List);
      }
    },
    addSelectionToListRequest: (
      _state,
      _action: PayloadAction<{ selection: SelectedCanvas[]; listId: string; manifestId: string }>,
    ) => {},
    addSelectionToListSuccess: (state, action: PayloadAction<List>) => {
      const list: List | undefined = state.values.find((elt) => elt.id === action.payload.id);
      if (list !== undefined) {
        list.content = action.payload.content;
      }
    },
    createListWithSelectionRequest: (
      _state,
      _action: PayloadAction<{ selection: SelectedCanvas[]; name: string; manifestId: string }>,
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
    removeFromOpenedLists: (state, action: PayloadAction<string>) => {
      const listId: string = action.payload;
      state.openedLists = state.openedLists.filter((elt) => elt.id !== listId);
    },
    importOneCollection: (_state, _action: PayloadAction<object>) => {},
    importMultipleCollections: (_state, _action: PayloadAction<ArrayBuffer>) => {},
    reset: (state) => {
      state.newListEvent = false;
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
  removeFromOpenedLists,
  // removeSelectionFromList,
  importOneCollection,
  importMultipleCollections,
  reset,
} = listsSlice.actions;
export default listsSlice.reducer;
