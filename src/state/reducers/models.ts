import { DataField, DataModel, DataModelCreateDTO } from '@/data/models/DataModel';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ModelsState {
  storedModels: DataModel[];
  activeModel: DataModel | null;
}

export const modelsInitialState: ModelsState = {
  storedModels: [],
  activeModel: null,
};

export const modelsSlice = createSlice({
  name: 'models',
  initialState: modelsInitialState,
  reducers: {
    setModels(state, action: PayloadAction<DataModel[]>) {
      state.storedModels = action.payload;
    },
    setActiveModel: (state, action: PayloadAction<string>) => {
      state.activeModel = state.storedModels.find((model) => model.id === action.payload) || null;
    },
    addFieldToModelRequest: (_state, _action: PayloadAction<DataField>) => {},
    addFieldToModelSuccess: (state, action: PayloadAction<DataField>) => {
      state.activeModel?.fields.push(action.payload);
    },
    createModelRequest: (_state, _action: PayloadAction<DataModelCreateDTO>) => {},
    createModelSuccess: (state, action: PayloadAction<DataModel>) => {
      state.storedModels.push(action.payload);
      state.activeModel = action.payload;
    },
    saveModelRequest: (_state, _action: PayloadAction<DataModel>) => {},
    saveModelSuccess: (state, action: PayloadAction<DataModel>) => {
      const index = state.storedModels.findIndex((model) => model.id === action.payload.id);
      if (index !== -1) {
        state.storedModels[index] = action.payload;
        state.activeModel = action.payload;
      }
    },
  },
});

export const {
  setModels,
  setActiveModel,
  addFieldToModelRequest,
  addFieldToModelSuccess,
  createModelRequest,
  createModelSuccess,
  saveModelRequest,
  saveModelSuccess,
} = modelsSlice.actions;
export default modelsSlice.reducer;
