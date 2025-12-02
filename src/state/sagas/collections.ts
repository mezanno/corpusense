import { Annotation, ElementType } from '@/data/models/Annotation';
import { Collection } from '@/data/models/Collection';
import {
  getAnnotationRepository,
  getCollectionRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import i18n from '@/i18n';
import { getErrorMessage } from '@/utils/utils';
import { Canvas } from '@iiif/presentation-3';
import { PayloadAction } from '@reduxjs/toolkit';
import { uniq } from 'lodash';
import { call, Effect, put, takeEvery } from 'redux-saga/effects';
import { loadCollectionRequest, loadCollectionSuccess } from '../reducers/collections';
import { pushError } from '../reducers/events';
import { fetchManifestFromURL } from './manifests';

function* handleLoadCollection(
  action: PayloadAction<string>,
  // ): Generator<Effect, void, Collection | StoredItem[] | Canvas | Annotation[] | NamedEntity[]> {
): Generator<Effect, void, Collection | Canvas[] | Annotation[]> {
  try {
    const collectionRepository = getCollectionRepository();

    //get the collection to load
    const collectionToLoad = (yield call(
      [collectionRepository, collectionRepository.getById],
      action.payload,
    )) as Collection;
    if (collectionToLoad === undefined) {
      yield put(pushError(i18n.t('error_collection_not_found')));
      return;
    }
    console.log(`Loading collection ${collectionToLoad.name} (${collectionToLoad.id})`);

    //compute the list of manifest ids in the collection and fetch them
    const manifestIds = uniq(collectionToLoad.content.map((elt) => elt.manifestId));
    console.log('Looking for ', manifestIds);

    // yield all(
    //   manifestIds.map((manifestId) => {
    //     call(handleFetchManifestFromURL, manifestId);
    //   }),
    // );
    for (const manifestId of manifestIds) {
      yield call(fetchManifestFromURL, manifestId);
    }

    const canvases: Canvas[] = (yield call(
      [collectionRepository, collectionRepository.getCanvasesByCollectionId],
      collectionToLoad.id,
    )) as Canvas[];

    //create a dictionary of canvas id -> hasOcrAnnotations
    const annotationRepository = getAnnotationRepository();
    const canvasHasOcrAnnotations: { [key: string]: boolean } = {};
    for (const canvas of canvases) {
      const annotations = (yield call(
        [annotationRepository, annotationRepository.getByScopeAndTypes],
        { collectionId: action.payload, canvasId: canvas.id },
        [ElementType.TEXT_LINE],
      )) as Annotation[];
      canvasHasOcrAnnotations[canvas.id] = annotations.length > 0;
    }

    yield put(
      loadCollectionSuccess({ collection: collectionToLoad, canvases, canvasHasOcrAnnotations }),
    );

    //load the entities of the collection
    // const annotationsIds = annotations.map((annotation) => annotation.id);
    // const namedEntityRepository = getNamedEntityRepository();
    // const namedEntities = (yield call(
    //   [namedEntityRepository, namedEntityRepository.getNamedEntitiesByAnnotationsIds],
    //   annotationsIds,
    // )) as NamedEntity[];
    // yield put(loadEntitiesSuccess(namedEntities));
  } catch (e) {
    yield put(pushError(getErrorMessage(e)));
  }
}

export default function* collectionsSaga() {
  yield takeEvery(loadCollectionRequest, handleLoadCollection);
}
