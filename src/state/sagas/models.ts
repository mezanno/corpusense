import { DataModel, DataModelCreateDTO } from '@/data/models/DataModel';
import { getModelRepository } from '@/data/repositories/indexeddb/dbFactory';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, Effect, put, takeEvery } from 'redux-saga/effects';
import { v4 as uuid } from 'uuid';
import {
  createModelRequest,
  createModelSuccess,
  removeModelRequest,
  removeModelSuccess,
  saveModelRequest,
  saveModelSuccess,
  setModels,
} from '../reducers/models';

function* fetchModels(): Generator<Effect, void, DataModel[]> {
  const modelRespository = getModelRepository();
  const models = yield call([modelRespository, modelRespository.getAll]);
  yield put(setModels(models));
}

function* handleCreateModel(action: PayloadAction<DataModelCreateDTO>) {
  const id = uuid();
  const newModel = {
    id,
    name: action.payload.name,
    description: action.payload.description,
    fields: [],
  };
  const modelRespository = getModelRepository();
  yield call([modelRespository, modelRespository.add], newModel);
  yield put(createModelSuccess(newModel));
}

function* handleSaveModel(action: PayloadAction<DataModel>) {
  const modelRespository = getModelRepository();
  yield call([modelRespository, modelRespository.update], action.payload);
  yield put(saveModelSuccess(action.payload));
}

function* handleRemoveModel(action: PayloadAction<string>) {
  const modelRespository = getModelRepository();
  yield call([modelRespository, modelRespository.delete], action.payload);
  yield put(removeModelSuccess(action.payload));
}

export default function* modelsSaga() {
  yield takeEvery(createModelRequest, handleCreateModel);
  yield takeEvery(saveModelRequest, handleSaveModel);
  yield takeEvery(removeModelRequest, handleRemoveModel);
}

export { fetchModels };
