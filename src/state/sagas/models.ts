import { DataField, DataModel, DataModelCreateDTO } from '@/data/models/DataModel';
import { getModelRepository } from '@/data/repositories/indexeddb/dbFactory';
import { getErrorMessage } from '@/utils/utils';
import { PayloadAction } from '@reduxjs/toolkit';
import FileSaver from 'file-saver';
import { t } from 'i18next';
import { call, Effect, put, takeEvery } from 'redux-saga/effects';
import { v4 as uuid } from 'uuid';
import { pushError } from '../reducers/events';
import {
  createModelRequest,
  createModelSuccess,
  exportModelRequest,
  importModelRequest,
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

function* handleCreateModel(
  action: PayloadAction<DataModelCreateDTO>,
): Generator<Effect, void, DataModel> {
  const id = uuid();
  const { name, description, fromModelId } = action.payload;
  let fields: DataField[] = [];
  if (fromModelId !== undefined) {
    try {
      const modelRespository = getModelRepository();
      const model = yield call([modelRespository, modelRespository.getById], fromModelId);
      fields = model.fields;
    } catch (error) {
      console.error('Error fetching model by ID:', error);
      // Handle the error as needed, e.g., show a notification or log it
    }
  }

  const newModel = {
    id,
    name: name,
    description: description,
    fields,
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

function* handleExportModel(action: PayloadAction<string>): Generator<Effect, void, DataModel> {
  const modelRespository = getModelRepository();
  try {
    const model = yield call([modelRespository, modelRespository.getById], action.payload);
    yield call(
      FileSaver.saveAs,
      new Blob([JSON.stringify(model)], { type: 'application/json' }),
      `${model.name}.json`,
    );
  } catch (error) {
    console.error('Error exporting model:', error);
    yield put(pushError('Error exporting model: ' + getErrorMessage(error)));
  }
}

function* handleImportModel(action: PayloadAction<object>): Generator<Effect, void, DataModel> {
  const modelRespository = getModelRepository();
  try {
    const model = action.payload as DataModel; //TODO: validate the model structure and display error if invalid
    const existingModel = yield call([modelRespository, modelRespository.getByName], model.name);
    if (existingModel !== null) {
      yield put(pushError(t('error_mode_name_exists', { name: model.name })));
      return;
    }
    yield call([modelRespository, modelRespository.add], model);
    yield put(createModelSuccess(model));
  } catch (error) {
    //TODO: faire une gestion des erreurs plus user friendly
    console.error('Error importing model:', error);
    yield put(pushError('Error importing model: ' + getErrorMessage(error)));
  }
}

export default function* modelsSaga() {
  yield takeEvery(createModelRequest, handleCreateModel);
  yield takeEvery(saveModelRequest, handleSaveModel);
  yield takeEvery(removeModelRequest, handleRemoveModel);
  yield takeEvery(exportModelRequest, handleExportModel);
  yield takeEvery(importModelRequest, handleImportModel);
}

export { fetchModels };
