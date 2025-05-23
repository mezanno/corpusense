import { NamedEntity } from '@/data/models/NamedEntity';
import { getNamedEntityRepository } from '@/data/repositories/indexeddb/dbFactory';
import { PayloadAction } from '@reduxjs/toolkit';
import { uniq } from 'lodash';
import { call, Effect, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { v4 as uuid } from 'uuid';
import {
  AddEntityPayload,
  addEntityRequest,
  addEntitySuccess,
  loadEntitiesRequest,
  loadEntitiesSuccess,
} from '../reducers/namedEntities';

function* handleLoadEntities(
  action: PayloadAction<string>,
): Generator<Effect, void, NamedEntity[]> {
  const namedEntityRepository = getNamedEntityRepository();
  const entities = yield call(
    [namedEntityRepository, namedEntityRepository.getByAnnotationId],
    action.payload,
  );
  yield put(loadEntitiesSuccess(entities));
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
