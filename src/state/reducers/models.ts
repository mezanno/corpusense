import { DataModel, DataModelCreateDTO } from '@/data/models/DataModel';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { remove } from 'lodash';

interface ModelsState {
  storedModels: DataModel[];
}

export const modelsInitialState: ModelsState = {
  storedModels: [],
};

export const modelsSlice = createSlice({
  name: 'models',
  initialState: modelsInitialState,
  reducers: {
    setModels(state, action: PayloadAction<DataModel[]>) {
      state.storedModels = action.payload;
    },
    createModelRequest: (_state, _action: PayloadAction<DataModelCreateDTO>) => {},
    createModelSuccess: (state, action: PayloadAction<DataModel>) => {
      state.storedModels.push(action.payload);
    },
    saveModelRequest: (_state, _action: PayloadAction<DataModel>) => {},
    saveModelSuccess: (state, action: PayloadAction<DataModel>) => {
      const index = state.storedModels.findIndex((model) => model.id === action.payload.id);
      if (index !== -1) {
        state.storedModels[index] = action.payload;
      }
    },
    removeModelRequest: (_state, _action: PayloadAction<string>) => {}, //payload is modelId
    removeModelSuccess: (_state, _action: PayloadAction<string>) => {
      const modelId = _action.payload;
      remove(_state.storedModels, (model) => model.id === modelId);
    },
    exportModelRequest: (_state, _action: PayloadAction<string>) => {}, //payload is modelId
    importModelRequest: (_state, _action: PayloadAction<object>) => {}, //payload is modelId
  },
});

export const {
  setModels,
  createModelRequest,
  createModelSuccess,
  saveModelRequest,
  saveModelSuccess,
  removeModelRequest,
  removeModelSuccess,
  exportModelRequest,
  importModelRequest,
} = modelsSlice.actions;
export default modelsSlice.reducer;
