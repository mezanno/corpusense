import { Annotation } from '@/data/models/Annotation';
import { Collection } from '@/data/models/Collection';
import { DataModel } from '@/data/models/DataModel';
import { NamedEntity } from '@/data/models/NamedEntity';
import { Result } from '@/data/models/Result';
import { CanvasScope } from '@/data/models/Scope';
import {
  getAnnotationRepository,
  getCollectionRepository,
  getModelRepository,
  getNamedEntityRepository,
  getResultRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { generateNamedEntity } from '@/data/utils/namedEntity';
import { PayloadAction } from '@reduxjs/toolkit';
import { uniq } from 'lodash';
import { call, Effect, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { v4 as uuid } from 'uuid';
import { pushError } from '../reducers/events';
import {
  AddEntityPayload,
  addEntityRequest,
  addEntitySuccess,
  loadEntitiesRequest,
  loadEntitiesSuccess,
} from '../reducers/namedEntities';

// //! Cette fonction existe déjà dans src/state/sagas/plugins/mistral.ts
// function hasModel(params: PluginParams): params is PluginParams & { model: DataModel } {
//   return 'model' in params;
// }

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'number');
}

function* handleLoadEntities(
  action: PayloadAction<CanvasScope>,
): Generator<Effect, void, Result | Annotation[] | Collection | DataModel> {
  const resultRepository = getResultRepository();
  const result = (yield call(
    [resultRepository, resultRepository.getByScopeAndWorkerName],
    action.payload,
    'mistral',
  )) as Result;
  const { value, scope } = result;

  let model = undefined;
  const collectionRepository = getCollectionRepository();
  try {
    const collection = (yield call(
      [collectionRepository, collectionRepository.getById],
      scope.collectionId,
    )) as Collection;
    const modelId = collection.modelId;
    if (modelId === undefined) {
      yield put(pushError('error_model_undefined'));
      return;
    }
    const modelRepository = getModelRepository();
    model = (yield call([modelRepository, modelRepository.getById], modelId)) as DataModel;
  } catch (error) {
    yield put(pushError('error_model_undefined'));
    return;
  }

  const annotationRepository = getAnnotationRepository();
  const annotations = (yield call(
    [annotationRepository, annotationRepository.getByScope],
    scope,
  )) as Annotation[];

  const dataParsed = JSON.parse(value as string) as unknown;
  const dataParsedArray = (Array.isArray(dataParsed) ? dataParsed : [dataParsed]) as unknown[];
  const namedEntities: NamedEntity[] = [];
  dataParsedArray.forEach((item) => {
    if (
      item !== undefined &&
      item !== null &&
      typeof item === 'object' &&
      'position' in item &&
      isNumberArray(item.position)
    ) {
      const positions = item.position;
      const annotationsForItem: Annotation[] = annotations.filter((_, index) =>
        positions.includes(index),
      );
      model.fields.forEach((field) => {
        if (
          typeof item === 'object' &&
          item !== null &&
          field.name in (item as Record<string, unknown>)
        ) {
          const itemValue = (item as Record<string, unknown>)[field.name] as string;
          namedEntities.push(generateNamedEntity(field, itemValue, annotationsForItem));
        }
      });
    }
  });

  yield put(loadEntitiesSuccess(namedEntities));
}

function* handleAddEntity(action: PayloadAction<AddEntityPayload>): Generator<Effect, void, void> {
  const { rects, type } = action.payload;

  const newNamedEntity = {
    id: uuid(),
    dataFieldId: type.id,
    value: rects.map((rect) => rect.word).join(' '),
    selector: rects.reduce(
      (selectors, rect) => {
        const se = selectors.find((s) => s.annotationId === rect.annotationId);
        if (se) {
          se.indexes.push(rect.annotationWordIndex);
        } else {
          selectors.push({
            annotationId: rect.annotationId,
            indexes: [rect.annotationWordIndex],
          });
        }
        return selectors;
      },
      [] as NamedEntity['selector'],
    ),
    annotationIds: uniq(rects.map((rect) => rect.annotationId)),
  };
  const namedEntityRepository = getNamedEntityRepository();
  yield call([namedEntityRepository, namedEntityRepository.add], newNamedEntity);
  yield put(addEntitySuccess(newNamedEntity));
}

export default function* entitiesSaga() {
  yield takeLatest(loadEntitiesRequest, handleLoadEntities);
  yield takeEvery(addEntityRequest, handleAddEntity);
}
